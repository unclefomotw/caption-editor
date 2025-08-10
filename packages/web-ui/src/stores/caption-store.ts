import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  CaptionFile,
  CaptionSegment,
} from '../../../common-types/src/types';
import type { StoredVideoFile } from '../utils/persistence';
import { apiClient } from '../utils/api-client';

interface VideoFileMetadata {
  name: string;
  size: number;
  lastModified: number;
}

interface VideoState {
  url: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isReady: boolean;
  storedFile: StoredVideoFile | null; // For persistence
  fileName: string | null; // For display
  fileMetadata: VideoFileMetadata | null; // For recovery matching
  file: File | null; // Original file for backend upload
}

interface CaptionStore {
  // Video state
  video: VideoState;

  // Caption data
  captionFile: CaptionFile | null;
  selectedSegmentId: string | null;

  // UI state
  lastSaved: Date | null;

  // Recovery control
  captionsCleared: boolean; // Track if captions were cleared on startup

  // API state
  transcription: {
    jobId: string | null;
    status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
    error: string | null;
  };
  uploadedVideoId: string | null;

  // Video actions
  setVideoUrl: (url: string) => void;
  setVideoDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVideoReady: (ready: boolean) => void;
  setVideoFile: (file: File) => Promise<void>;
  restoreVideoFromStorage: () => Promise<boolean>;
  clearVideoStorage: () => void;
  checkAndRestoreCaptions: (file: File) => void;

  // Caption actions
  setCaptionFile: (file: CaptionFile) => void;
  addSegment: (segment: CaptionSegment) => void;
  updateSegment: (id: string, updates: Partial<CaptionSegment>) => void;
  deleteSegment: (id: string) => void;
  splitSegment: (id: string, splitTime: number) => void;
  mergeSegments: (firstId: string, secondId: string) => void;

  // Selection actions
  selectSegment: (id: string | null) => void;
  selectSegmentByTime: (time: number) => void;

  // Edit actions
  markSaved: () => void;

  // API actions
  uploadVideoToBackend: (file: File) => Promise<void>;
  startTranscription: (videoId?: string, videoUrl?: string) => Promise<void>;
  checkTranscriptionStatus: () => Promise<void>;
  clearTranscriptionState: () => void;

  // Utility actions
  reset: () => void;
  getCurrentSegment: () => CaptionSegment | null;
  getSegmentsByTimeRange: (
    startTime: number,
    endTime: number
  ) => CaptionSegment[];
  clearCaptionsOnStartup: () => void;
}

const initialVideoState: VideoState = {
  url: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  isReady: false,
  storedFile: null,
  fileName: null,
  fileMetadata: null,
  file: null,
};

export const useCaptionStore = create<CaptionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state - per recovery spec, captions should NOT auto-restore
        video: initialVideoState,
        captionFile: null, // Will be set by clearCaptionsOnStartup if needed
        selectedSegmentId: null,
        lastSaved: null,
        captionsCleared: false,

        // API state
        transcription: {
          jobId: null,
          status: 'idle',
          error: null,
        },
        uploadedVideoId: null,

        // Video actions
        setVideoUrl: (url) =>
          set(
            (state) => ({
              video: { ...state.video, url },
            }),
            false,
            'setVideoUrl'
          ),

        setVideoFile: async (file) => {
          const url = URL.createObjectURL(file);

          console.log(
            '📁 Loading video file. Checking for caption recovery...'
          );

          // Create file metadata for recovery matching
          const fileMetadata: VideoFileMetadata = {
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
          };

          // Never store video files - only caption data persists
          set(
            (state) => ({
              video: {
                ...state.video,
                url,
                fileName: file.name,
                fileMetadata,
                file, // Store the original file for backend upload
                storedFile: null, // Never store video files
                duration: 0,
                currentTime: 0,
                isPlaying: false,
                isReady: false,
              },
            }),
            false,
            'setVideoFile'
          );

          // Check and conditionally restore captions based on recovery spec
          get().checkAndRestoreCaptions(file);
        },

        restoreVideoFromStorage: async () => {
          // Videos are never stored - only caption data persists
          // This is intentional per the recovery spec: user re-uploads video, captions restore
          console.log(
            'ℹ️ Video files are not stored. Caption data will restore when you re-upload the video.'
          );
          return false;
        },

        clearVideoStorage: () => {
          set(
            (state) => ({
              video: {
                ...initialVideoState,
              },
            }),
            false,
            'clearVideoStorage'
          );
        },

        checkAndRestoreCaptions: (file) => {
          const state = get();

          // Get persisted data from localStorage (since Zustand persist may not have loaded yet)
          const persistedData = localStorage.getItem('caption-editor-store');
          if (!persistedData) {
            console.log('🔍 No persisted caption data found in localStorage');
            return;
          }

          console.log(
            '🔍 Raw localStorage data:',
            persistedData.substring(0, 200) + '...'
          );

          try {
            const parsed = JSON.parse(persistedData);
            console.log('🔍 Parsed localStorage structure:', {
              hasState: !!parsed.state,
              hasCaptionFile: !!parsed.state?.captionFile,
              hasVideoMetadata: !!parsed.state?.videoFileMetadata,
              keys: Object.keys(parsed.state || {}),
            });

            const storedCaptionFile = parsed.state?.captionFile;
            const storedVideoMetadata = parsed.state?.videoFileMetadata;

            console.log('🔍 Extracted data:', {
              storedCaptionFile: storedCaptionFile ? 'EXISTS' : 'NULL',
              storedVideoMetadata: storedVideoMetadata ? 'EXISTS' : 'NULL',
              captionSegments: storedCaptionFile?.segments?.length || 0,
              videoMetadataKeys: storedVideoMetadata
                ? Object.keys(storedVideoMetadata)
                : [],
            });

            if (!storedCaptionFile || !storedVideoMetadata) {
              console.log(
                '❌ Missing data - CaptionFile:',
                !!storedCaptionFile,
                'VideoMetadata:',
                !!storedVideoMetadata
              );
              return;
            }

            // Check if current file matches stored video metadata
            const currentFileInfo = {
              name: file.name,
              size: file.size,
              lastModified: file.lastModified,
            };
            console.log('🔍 File comparison:');
            console.log('  Stored:', storedVideoMetadata);
            console.log('  Current:', currentFileInfo);

            const isMatch =
              storedVideoMetadata.name === file.name &&
              storedVideoMetadata.size === file.size &&
              storedVideoMetadata.lastModified === file.lastModified;

            console.log('  Match result:', isMatch);

            if (isMatch) {
              console.log('✅ Video file matches! Restoring captions...');
              set(
                (state) => ({
                  captionFile: storedCaptionFile,
                  captionsCleared: false, // Reset flag so restored captions can be persisted again
                }),
                false,
                'restoreCaptions'
              );
            } else {
              console.log(
                '❌ Different video file detected. Clearing captions in UI only.'
              );
              // Clear captions in UI but don't save to localStorage (preserve stored captions for recovery)
              set(
                (state) => ({
                  captionFile: null,
                  selectedSegmentId: null,
                }),
                false,
                'clearCaptionsForDifferentVideo'
              );
            }
          } catch (error) {
            console.error('Error checking caption recovery:', error);
          }
        },

        setVideoDuration: (duration) =>
          set(
            (state) => ({
              video: { ...state.video, duration },
            }),
            false,
            'setVideoDuration'
          ),

        setCurrentTime: (currentTime) =>
          set(
            (state) => ({
              video: { ...state.video, currentTime },
            }),
            false,
            'setCurrentTime'
          ),

        setIsPlaying: (isPlaying) =>
          set(
            (state) => ({
              video: { ...state.video, isPlaying },
            }),
            false,
            'setIsPlaying'
          ),

        setVideoReady: (isReady) =>
          set(
            (state) => ({
              video: { ...state.video, isReady },
            }),
            false,
            'setVideoReady'
          ),

        // Caption actions
        setCaptionFile: (captionFile) => {
          set(
            {
              captionFile,
              captionsCleared: false, // Reset the flag so captions can be persisted
            },
            false,
            'setCaptionFile'
          );
        },

        addSegment: (segment) =>
          set(
            (state) => {
              if (!state.captionFile) return state;

              const segments = [...state.captionFile.segments, segment].sort(
                (a, b) => a.startTime - b.startTime
              );

              return {
                captionFile: {
                  ...state.captionFile,
                  segments,
                  updatedAt: new Date().toISOString(),
                },
                lastSaved: new Date(),
                captionsCleared: false, // Enable persistence for edits
              };
            },
            false,
            'addSegment'
          ),

        updateSegment: (id, updates) =>
          set(
            (state) => {
              if (!state.captionFile) return state;

              const segments = state.captionFile.segments.map((segment) =>
                segment.id === id ? { ...segment, ...updates } : segment
              );

              return {
                captionFile: {
                  ...state.captionFile,
                  segments,
                  updatedAt: new Date().toISOString(),
                },
                lastSaved: new Date(),
                captionsCleared: false, // Enable persistence for edits
              };
            },
            false,
            'updateSegment'
          ),

        deleteSegment: (id) =>
          set(
            (state) => {
              if (!state.captionFile) return state;

              const segments = state.captionFile.segments.filter(
                (segment) => segment.id !== id
              );

              return {
                captionFile: {
                  ...state.captionFile,
                  segments,
                  updatedAt: new Date().toISOString(),
                },
                selectedSegmentId:
                  state.selectedSegmentId === id
                    ? null
                    : state.selectedSegmentId,
                lastSaved: new Date(),
                captionsCleared: false, // Enable persistence for edits
              };
            },
            false,
            'deleteSegment'
          ),

        splitSegment: (id, splitTime) =>
          set(
            (state) => {
              if (!state.captionFile) return state;

              const segment = state.captionFile.segments.find(
                (s) => s.id === id
              );
              if (
                !segment ||
                splitTime <= segment.startTime ||
                splitTime >= segment.endTime
              ) {
                return state;
              }

              const newSegment: CaptionSegment = {
                id: `${id}_split_${Date.now()}`,
                startTime: splitTime,
                endTime: segment.endTime,
                text: '',
                confidence: segment.confidence,
                speaker: segment.speaker,
              };

              const segments = state.captionFile.segments
                .map((s) => (s.id === id ? { ...s, endTime: splitTime } : s))
                .concat(newSegment);

              return {
                captionFile: {
                  ...state.captionFile,
                  segments,
                  updatedAt: new Date().toISOString(),
                },
                lastSaved: new Date(),
                captionsCleared: false, // Enable persistence for edits
              };
            },
            false,
            'splitSegment'
          ),

        mergeSegments: (firstId, secondId) =>
          set(
            (state) => {
              if (!state.captionFile) return state;

              const first = state.captionFile.segments.find(
                (s) => s.id === firstId
              );
              const second = state.captionFile.segments.find(
                (s) => s.id === secondId
              );

              if (!first || !second) return state;

              // Ensure proper order
              const [earlier, later] =
                first.startTime < second.startTime
                  ? [first, second]
                  : [second, first];

              const mergedSegment: CaptionSegment = {
                id: earlier.id,
                startTime: earlier.startTime,
                endTime: later.endTime,
                text: `${earlier.text} ${later.text}`.trim(),
                confidence: Math.min(
                  earlier.confidence || 1,
                  later.confidence || 1
                ),
                speaker:
                  earlier.speaker === later.speaker
                    ? earlier.speaker
                    : undefined,
              };

              const segments = state.captionFile.segments
                .filter((s) => s.id !== firstId && s.id !== secondId)
                .concat(mergedSegment)
                .sort((a, b) => a.startTime - b.startTime);

              return {
                captionFile: {
                  ...state.captionFile,
                  segments,
                  updatedAt: new Date().toISOString(),
                },
                selectedSegmentId: mergedSegment.id,
                lastSaved: new Date(),
                captionsCleared: false, // Enable persistence for edits
              };
            },
            false,
            'mergeSegments'
          ),

        // Selection actions
        selectSegment: (selectedSegmentId) =>
          set({ selectedSegmentId }, false, 'selectSegment'),

        selectSegmentByTime: (time) =>
          set(
            (state) => {
              if (!state.captionFile) return state;

              const segment = state.captionFile.segments.find(
                (s) => time >= s.startTime && time <= s.endTime
              );

              return {
                selectedSegmentId: segment?.id || null,
              };
            },
            false,
            'selectSegmentByTime'
          ),

        // Edit actions

        markSaved: () => set({ lastSaved: new Date() }, false, 'markSaved'),

        // Utility actions
        reset: () =>
          set(
            {
              video: initialVideoState,
              captionFile: null,
              selectedSegmentId: null,
              lastSaved: null,
            },
            false,
            'reset'
          ),

        getCurrentSegment: () => {
          const state = get();
          if (!state.captionFile || !state.selectedSegmentId) return null;

          return (
            state.captionFile.segments.find(
              (s) => s.id === state.selectedSegmentId
            ) || null
          );
        },

        getSegmentsByTimeRange: (startTime, endTime) => {
          const state = get();
          if (!state.captionFile) return [];

          return state.captionFile.segments.filter(
            (s) => s.startTime < endTime && s.endTime > startTime
          );
        },

        clearCaptionsOnStartup: () => {
          // Clear captions on startup per recovery spec - only restore when video matches
          if (!get().captionsCleared && get().captionFile !== null) {
            console.log('🔄 Clearing auto-restored captions per recovery spec');

            // Use skipPersist: true to prevent this clearing from being saved to localStorage
            set(
              {
                captionFile: null,
                selectedSegmentId: null,
                captionsCleared: true,
              },
              false,
              'clearCaptionsOnStartup'
            );
          }
        },

        // API actions
        uploadVideoToBackend: async (file: File) => {
          try {
            set(
              (state) => ({
                transcription: {
                  ...state.transcription,
                  status: 'uploading',
                  error: null,
                },
              }),
              false,
              'uploadVideoToBackend:start'
            );

            const response = await apiClient.uploadVideo(file);
            console.log('✅ Video uploaded to backend:', response);

            set(
              (state) => ({
                uploadedVideoId: response.video_id,
                transcription: {
                  ...state.transcription,
                  status: 'idle',
                },
              }),
              false,
              'uploadVideoToBackend:success'
            );
          } catch (error) {
            console.error('❌ Failed to upload video:', error);
            set(
              (state) => ({
                transcription: {
                  ...state.transcription,
                  status: 'error',
                  error:
                    error instanceof Error ? error.message : 'Upload failed',
                },
              }),
              false,
              'uploadVideoToBackend:error'
            );
          }
        },

        startTranscription: async (videoId?: string, videoUrl?: string) => {
          try {
            const state = get();
            const requestVideoId = videoId || state.uploadedVideoId;

            if (!requestVideoId && !videoUrl) {
              throw new Error('No video ID or URL provided for transcription');
            }

            set(
              (state) => ({
                transcription: {
                  ...state.transcription,
                  status: 'processing',
                  error: null,
                },
              }),
              false,
              'startTranscription:start'
            );

            const response = await apiClient.startTranscription({
              video_id: requestVideoId || undefined,
              video_url: videoUrl,
              language: 'en',
            });

            console.log('✅ Transcription started:', response);

            set(
              (state) => ({
                transcription: {
                  ...state.transcription,
                  jobId: response.job_id || null,
                },
              }),
              false,
              'startTranscription:success'
            );
          } catch (error) {
            console.error('❌ Failed to start transcription:', error);
            set(
              (state) => ({
                transcription: {
                  ...state.transcription,
                  status: 'error',
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Transcription failed',
                },
              }),
              false,
              'startTranscription:error'
            );
          }
        },

        checkTranscriptionStatus: async () => {
          try {
            const state = get();
            if (!state.transcription.jobId) {
              throw new Error('No transcription job ID available');
            }

            const response = await apiClient.getTranscriptionResult(
              state.transcription.jobId
            );
            console.log('🔍 Transcription status:', response);

            if (response.status === 'completed' && response.captions) {
              // Convert API response to CaptionFile format
              const captionFile: CaptionFile = {
                segments: response.captions.segments.map((seg: any) => ({
                  id: seg.id,
                  startTime: seg.start_time,
                  endTime: seg.end_time,
                  text: seg.text,
                  confidence: 1.0, // API might not provide this
                })),
                language: 'en',
                format: 'vtt',
                metadata: {
                  title: `AI Transcription - ${new Date().toLocaleDateString()}`,
                  createdAt: new Date().toISOString(),
                  modifiedAt: new Date().toISOString(),
                },
              };

              set(
                {
                  captionFile,
                  captionsCleared: false,
                  transcription: {
                    jobId: null,
                    status: 'completed',
                    error: null,
                  },
                },
                false,
                'checkTranscriptionStatus:completed'
              );
            } else if (response.status === 'error') {
              set(
                (state) => ({
                  transcription: {
                    ...state.transcription,
                    status: 'error',
                    error: response.message || 'Transcription failed',
                  },
                }),
                false,
                'checkTranscriptionStatus:error'
              );
            }
            // If still processing, keep checking
          } catch (error) {
            console.error('❌ Failed to check transcription status:', error);
            set(
              (state) => ({
                transcription: {
                  ...state.transcription,
                  status: 'error',
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Status check failed',
                },
              }),
              false,
              'checkTranscriptionStatus:error'
            );
          }
        },

        clearTranscriptionState: () => {
          set(
            {
              transcription: {
                jobId: null,
                status: 'idle',
                error: null,
              },
              uploadedVideoId: null,
            },
            false,
            'clearTranscriptionState'
          );
        },
      }),
      {
        name: 'caption-editor-store',
        partialize: (state) => {
          // Special case: If captions were cleared on startup, preserve existing localStorage data
          if (state.captionsCleared && state.captionFile === null) {
            // Get the current localStorage data to preserve captionFile
            const existingData = localStorage.getItem('caption-editor-store');
            if (existingData) {
              try {
                const parsed = JSON.parse(existingData);
                const existingCaptionFile = parsed.state?.captionFile;

                if (existingCaptionFile) {
                  console.log(
                    '🔒 Preserving existing caption data during startup clearing'
                  );
                  const existingVideoMetadata = parsed.state?.videoFileMetadata;
                  const preserved = {
                    lastSaved: state.lastSaved,
                    videoFileMetadata: existingVideoMetadata, // Preserve the existing video metadata too!
                    captionFile: existingCaptionFile, // Preserve the existing data
                  };
                  return preserved;
                }
              } catch (error) {
                console.warn(
                  'Could not parse existing localStorage data:',
                  error
                );
              }
            }
          }

          // Normal persistence logic
          const shouldPersistCaptions =
            state.captionFile !== null && !state.captionsCleared;

          const persistedState: any = {
            lastSaved: state.lastSaved,
            videoFileMetadata: state.video.fileMetadata,
          };

          // Only add captionFile to persisted state if we should persist it
          if (shouldPersistCaptions) {
            persistedState.captionFile = state.captionFile;
          }

          return persistedState;
        },
        version: 1, // Add versioning for future migrations
        // Don't use merge function - handle recovery manually in checkAndRestoreCaptions
      }
    ),
    {
      name: 'caption-store',
    }
  )
);
