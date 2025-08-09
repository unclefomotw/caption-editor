import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { CaptionSegment, CaptionFile } from '../../../common-types/src/types';
import { fileToStoredFile, storedFileToBlob, isStoredVideoValid } from '../utils/persistence';
import type { StoredVideoFile } from '../utils/persistence';

interface VideoState {
  url: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isReady: boolean;
  storedFile: StoredVideoFile | null; // For persistence
  fileName: string | null; // For display
}

interface CaptionStore {
  // Video state
  video: VideoState;
  
  // Caption data
  captionFile: CaptionFile | null;
  selectedSegmentId: string | null;
  
  // UI state
  isEditing: boolean;
  lastSaved: Date | null;
  
  // Video actions
  setVideoUrl: (url: string) => void;
  setVideoDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVideoReady: (ready: boolean) => void;
  setVideoFile: (file: File) => Promise<void>;
  restoreVideoFromStorage: () => Promise<boolean>;
  clearVideoStorage: () => void;
  
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
  setIsEditing: (editing: boolean) => void;
  markSaved: () => void;
  
  // Utility actions
  reset: () => void;
  getCurrentSegment: () => CaptionSegment | null;
  getSegmentsByTimeRange: (startTime: number, endTime: number) => CaptionSegment[];
}

const initialVideoState: VideoState = {
  url: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  isReady: false,
  storedFile: null,
  fileName: null,
};

export const useCaptionStore = create<CaptionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        video: initialVideoState,
        captionFile: null,
        selectedSegmentId: null,
        isEditing: false,
        lastSaved: null,
        
        // Video actions
        setVideoUrl: (url) =>
          set((state) => ({
            video: { ...state.video, url },
          }), false, 'setVideoUrl'),
          
        setVideoFile: async (file) => {
          const url = URL.createObjectURL(file);
          
          console.log('📁 Loading video file (captions will auto-save, video must be re-uploaded after refresh)');
          
          // Never store video files - only caption data persists
          // This meets the recovery spec: user re-uploads video, captions restore
          set((state) => ({
            video: {
              ...state.video,
              url,
              fileName: file.name,
              storedFile: null, // Never store video files
              duration: 0,
              currentTime: 0,
              isPlaying: false,
              isReady: false,
            },
          }), false, 'setVideoFile');
        },
        
        restoreVideoFromStorage: async () => {
          // Videos are never stored - only caption data persists
          // This is intentional per the recovery spec: user re-uploads video, captions restore
          console.log('ℹ️ Video files are not stored. Caption data will restore when you re-upload the video.');
          return false;
        },
        
        clearVideoStorage: () => {
          set((state) => ({
            video: {
              ...initialVideoState,
            },
          }), false, 'clearVideoStorage');
        },
          
        setVideoDuration: (duration) =>
          set((state) => ({
            video: { ...state.video, duration },
          }), false, 'setVideoDuration'),
          
        setCurrentTime: (currentTime) =>
          set((state) => ({
            video: { ...state.video, currentTime },
          }), false, 'setCurrentTime'),
          
        setIsPlaying: (isPlaying) =>
          set((state) => ({
            video: { ...state.video, isPlaying },
          }), false, 'setIsPlaying'),
          
        setVideoReady: (isReady) =>
          set((state) => ({
            video: { ...state.video, isReady },
          }), false, 'setVideoReady'),
        
        // Caption actions
        setCaptionFile: (captionFile) =>
          set({ captionFile }, false, 'setCaptionFile'),
          
        addSegment: (segment) =>
          set((state) => {
            if (!state.captionFile) return state;
            
            const segments = [...state.captionFile.segments, segment]
              .sort((a, b) => a.startTime - b.startTime);
              
            return {
              captionFile: {
                ...state.captionFile,
                segments,
                updatedAt: new Date().toISOString(),
              },
              isEditing: true,
              lastSaved: new Date(),
            };
          }, false, 'addSegment'),
          
        updateSegment: (id, updates) =>
          set((state) => {
            if (!state.captionFile) return state;
            
            const segments = state.captionFile.segments.map(segment =>
              segment.id === id ? { ...segment, ...updates } : segment
            );
            
            return {
              captionFile: {
                ...state.captionFile,
                segments,
                updatedAt: new Date().toISOString(),
              },
              isEditing: true,
              lastSaved: new Date(),
            };
          }, false, 'updateSegment'),
          
        deleteSegment: (id) =>
          set((state) => {
            if (!state.captionFile) return state;
            
            const segments = state.captionFile.segments.filter(
              segment => segment.id !== id
            );
            
            return {
              captionFile: {
                ...state.captionFile,
                segments,
                updatedAt: new Date().toISOString(),
              },
              selectedSegmentId: state.selectedSegmentId === id ? null : state.selectedSegmentId,
              isEditing: true,
              lastSaved: new Date(),
            };
          }, false, 'deleteSegment'),
          
        splitSegment: (id, splitTime) =>
          set((state) => {
            if (!state.captionFile) return state;
            
            const segment = state.captionFile.segments.find(s => s.id === id);
            if (!segment || splitTime <= segment.startTime || splitTime >= segment.endTime) {
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
            
            const segments = state.captionFile.segments.map(s =>
              s.id === id 
                ? { ...s, endTime: splitTime }
                : s
            ).concat(newSegment);
            
            return {
              captionFile: {
                ...state.captionFile,
                segments,
                updatedAt: new Date().toISOString(),
              },
              isEditing: true,
              lastSaved: new Date(),
            };
          }, false, 'splitSegment'),
          
        mergeSegments: (firstId, secondId) =>
          set((state) => {
            if (!state.captionFile) return state;
            
            const first = state.captionFile.segments.find(s => s.id === firstId);
            const second = state.captionFile.segments.find(s => s.id === secondId);
            
            if (!first || !second) return state;
            
            // Ensure proper order
            const [earlier, later] = first.startTime < second.startTime 
              ? [first, second] : [second, first];
            
            const mergedSegment: CaptionSegment = {
              id: earlier.id,
              startTime: earlier.startTime,
              endTime: later.endTime,
              text: `${earlier.text} ${later.text}`.trim(),
              confidence: Math.min(earlier.confidence || 1, later.confidence || 1),
              speaker: earlier.speaker === later.speaker ? earlier.speaker : undefined,
            };
            
            const segments = state.captionFile.segments
              .filter(s => s.id !== firstId && s.id !== secondId)
              .concat(mergedSegment)
              .sort((a, b) => a.startTime - b.startTime);
            
            return {
              captionFile: {
                ...state.captionFile,
                segments,
                updatedAt: new Date().toISOString(),
              },
              selectedSegmentId: mergedSegment.id,
              isEditing: true,
              lastSaved: new Date(),
            };
          }, false, 'mergeSegments'),
        
        // Selection actions
        selectSegment: (selectedSegmentId) =>
          set({ selectedSegmentId }, false, 'selectSegment'),
          
        selectSegmentByTime: (time) =>
          set((state) => {
            if (!state.captionFile) return state;
            
            const segment = state.captionFile.segments.find(
              s => time >= s.startTime && time <= s.endTime
            );
            
            return {
              selectedSegmentId: segment?.id || null,
            };
          }, false, 'selectSegmentByTime'),
        
        // Edit actions
        setIsEditing: (isEditing) =>
          set({ isEditing }, false, 'setIsEditing'),
          
        markSaved: () =>
          set({ lastSaved: new Date(), isEditing: false }, false, 'markSaved'),
        
        // Utility actions
        reset: () =>
          set({
            video: initialVideoState,
            captionFile: null,
            selectedSegmentId: null,
            isEditing: false,
            lastSaved: null,
          }, false, 'reset'),
          
        getCurrentSegment: () => {
          const state = get();
          if (!state.captionFile || !state.selectedSegmentId) return null;
          
          return state.captionFile.segments.find(
            s => s.id === state.selectedSegmentId
          ) || null;
        },
        
        getSegmentsByTimeRange: (startTime, endTime) => {
          const state = get();
          if (!state.captionFile) return [];
          
          return state.captionFile.segments.filter(
            s => s.startTime < endTime && s.endTime > startTime
          );
        },
      }),
      {
        name: 'caption-editor-store',
        partialize: (state) => ({
          captionFile: state.captionFile,
          lastSaved: state.lastSaved,
          // Only persist caption data - no video storage per recovery spec
          // User re-uploads video, captions restore automatically
        }),
        version: 1, // Add versioning for future migrations
      }
    ),
    {
      name: 'caption-store',
    }
  )
);