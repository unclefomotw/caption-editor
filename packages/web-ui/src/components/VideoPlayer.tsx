'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCaptionStore } from '@/stores/caption-store';
import { Maximize2, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  className?: string;
  onVideoLoad?: (url: string) => void;
}

export function VideoPlayer({ className, onVideoLoad }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);

  const {
    video,
    setVideoUrl,
    setVideoDuration,
    setCurrentTime,
    setIsPlaying,
    setVideoReady,
    selectSegmentByTime,
    setCaptionFile,
    captionFile,
  } = useCaptionStore();

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔥 FILE UPLOAD HANDLER CALLED!');
    console.log('Files count:', event.target.files?.length || 0);

    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📁 File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    const supportedTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'video/x-m4v'];
    if (!supportedTypes.includes(file.type)) {
      console.log('❌ Unsupported file type:', file.type);
      alert('Please select a supported video file (.mp4, .mov, .m4v)');
      return;
    }

    // Create blob URL and update state
    const url = URL.createObjectURL(file);
    console.log('🔗 Created blob URL:', url);

    console.log('🔄 Updating Zustand state...');
    setVideoUrl(url);
    setVideoDuration(0);
    setCurrentTime(0);
    setVideoReady(false);
    setIsPlaying(false);

    console.log('✅ State updated! Calling onVideoLoad...');
    onVideoLoad?.(url);
    console.log('🎬 File upload process complete!');
  }, [setVideoUrl, setVideoDuration, setCurrentTime, setVideoReady, setIsPlaying, onVideoLoad]);


  // Handle time updates (HTML5 video event)
  const handleTimeUpdate = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = event.target as HTMLVideoElement;
    const currentTime = target.currentTime;

    setCurrentTime(currentTime);
    selectSegmentByTime(currentTime);
  }, [setCurrentTime, selectSegmentByTime]);

  // Handle duration change (HTML5 video event)
  const handleDurationChange = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = event.target as HTMLVideoElement;
    const duration = target.duration;
    console.log('HTML5 onDurationChange - duration:', duration);

    if (duration && duration > 0 && !isNaN(duration)) {
      setVideoDuration(duration);
      setVideoReady(true);
      console.log('✅ Duration set successfully:', duration);
      
      // Auto-generate sample caption file if none exists
      if (!captionFile) {
        const sampleCaptionFile = {
          id: `caption_${Date.now()}`,
          title: 'Auto-generated Captions',
          language: 'en',
          format: 'vtt' as const,
          segments: [
            {
              id: 'sample_1',
              startTime: 0,
              endTime: 3,
              text: 'Welcome to the video! This is the first caption segment.',
              confidence: 0.95,
            },
            {
              id: 'sample_2', 
              startTime: 3,
              endTime: 7,
              text: 'You can click on any caption to jump to that part of the video.',
              confidence: 0.92,
            },
            {
              id: 'sample_3',
              startTime: 7,
              endTime: 12,
              text: 'Try editing the text by clicking the edit button next to each segment.',
              confidence: 0.88,
            },
            {
              id: 'sample_4',
              startTime: 12,
              endTime: Math.min(duration, 18),
              text: 'The captions will highlight automatically as the video plays.',
              confidence: 0.90,
            },
          ].filter(segment => segment.endTime <= duration), // Only include segments within video duration
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log('🎬 Auto-generating sample caption file with', sampleCaptionFile.segments.length, 'segments');
        setCaptionFile(sampleCaptionFile);
      }
    }
  }, [setVideoDuration, setVideoReady]);

  // Add debugging effect to see what's happening with video element
  useEffect(() => {
    console.log('🔍 VideoPlayer effect - checking video element state...');
    if (video.url) {
      setTimeout(() => {
        const videoElement = document.querySelector('video');
        if (videoElement) {
          console.log('📊 Video element properties:', {
            src: videoElement.src,
            duration: videoElement.duration,
            readyState: videoElement.readyState,
            networkState: videoElement.networkState,
            error: videoElement.error
          });
        } else {
          console.log('❌ No video element found in DOM');
        }
      }, 1000);
    }
  }, [video.url]);

  // Handle when video starts playing
  const handlePlay = useCallback(() => {
    console.log('ReactPlayer onPlay called');
    setIsPlaying(true);

    // Duration should be handled by onReady callback
  }, [setIsPlaying]);

  // Handle video errors
  const handleError = useCallback((error: any) => {
    console.error('ReactPlayer error:', error);
  }, []);


  // Handle play/pause
  const togglePlayPause = useCallback(() => {
    const newPlayingState = !video.isPlaying;
    setIsPlaying(newPlayingState);
  }, [video.isPlaying, setIsPlaying]);

  // Handle seek (v3.x uses HTMLMediaElement interface)
  const handleSeek = useCallback((values: number[]) => {
    const seekTime = values[0];

    // Use ReactPlayer ref with HTMLMediaElement interface
    if (playerRef.current) {
      playerRef.current.currentTime = seekTime;
      console.log('🎯 Seeking to:', seekTime);
    }

    setCurrentTime(seekTime);
    selectSegmentByTime(seekTime);
  }, [setCurrentTime, selectSegmentByTime]);

  // Skip forward/backward
  const skipForward = useCallback(() => {
    const newTime = Math.min(video.currentTime + 10, video.duration);
    if (playerRef.current) {
      playerRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
    selectSegmentByTime(newTime);
  }, [video.currentTime, video.duration, setCurrentTime, selectSegmentByTime]);

  const skipBackward = useCallback(() => {
    const newTime = Math.max(video.currentTime - 10, 0);
    if (playerRef.current) {
      playerRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
    selectSegmentByTime(newTime);
  }, [video.currentTime, setCurrentTime, selectSegmentByTime]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Clean up blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (video.url && video.url.startsWith('blob:')) {
        URL.revokeObjectURL(video.url);
      }
    };
  }, [video.url]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with text inputs
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          event.preventDefault();
          skipForward();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, skipBackward, skipForward]);


  return (
    <div className={`bg-black rounded-lg overflow-hidden ${className}`}>
      {!video.url ? (
        // Upload area
        <div className="aspect-video bg-gray-900 flex flex-col items-center justify-center border-2 border-dashed border-gray-600 hover:border-gray-400 transition-colors">
          <div className="text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Upload a video to get started
            </h3>
            <p className="text-gray-400 mb-6">
              Supports .mp4, .mov, and .m4v files
            </p>
            <label htmlFor="video-upload">
              <Button asChild className="cursor-pointer">
                <span>Choose Video File</span>
              </Button>
            </label>
            <input
              id="video-upload"
              type="file"
              accept="video/mp4,video/mov,video/quicktime,video/x-m4v"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        // Video player
        <div className="relative group">
          <ReactPlayer
            ref={playerRef}
            src={video.url}
            width="100%"
            height="auto"
            playing={video.isPlaying}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onPlay={handlePlay}
            onPause={() => setIsPlaying(false)}
            onError={handleError}
            controls={false}
          />

          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[video.currentTime]}
                max={video.duration}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-300 mt-1">
                <span>{formatTime(video.currentTime)}</span>
                <span>{formatTime(video.duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipBackward}
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {video.isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipForward}
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="w-4 h-4 scale-x-[-1]" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}