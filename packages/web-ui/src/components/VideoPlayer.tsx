'use client';

import { useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useCaptionStore } from '@/stores/caption-store';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, Maximize2, RotateCcw } from 'lucide-react';

interface VideoPlayerProps {
  className?: string;
  onVideoLoad?: (url: string) => void;
}

export function VideoPlayer({ className, onVideoLoad }: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  
  const {
    video,
    setVideoUrl,
    setVideoDuration,
    setCurrentTime,
    setIsPlaying,
    setVideoReady,
    selectSegmentByTime,
  } = useCaptionStore();

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const supportedTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'video/x-m4v'];
    if (!supportedTypes.includes(file.type)) {
      alert('Please select a supported video file (.mp4, .mov, .m4v)');
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    onVideoLoad?.(url);
  }, [setVideoUrl, onVideoLoad]);

  // Handle when video is ready to play
  const handleReady = useCallback(() => {
    setVideoReady(true);
    // Get duration from the player ref
    if (playerRef.current) {
      const duration = playerRef.current.getDuration();
      if (duration) {
        setVideoDuration(duration);
      }
    }
  }, [setVideoReady, setVideoDuration]);

  // Handle progress updates
  const handleProgress = useCallback((progress: { playedSeconds: number, loadedSeconds: number, played: number, loaded: number }) => {
    setCurrentTime(progress.playedSeconds);
    selectSegmentByTime(progress.playedSeconds);
    
    // Set duration if we haven't got it yet and player is ready
    if (!video.isReady && playerRef.current) {
      const duration = playerRef.current.getDuration();
      if (duration > 0) {
        setVideoDuration(duration);
        setVideoReady(true);
      }
    }
  }, [setCurrentTime, selectSegmentByTime, video.isReady, setVideoDuration, setVideoReady]);

  // Handle play/pause
  const togglePlayPause = useCallback(() => {
    setIsPlaying(!video.isPlaying);
  }, [video.isPlaying, setIsPlaying]);

  // Handle seek
  const handleSeek = useCallback((values: number[]) => {
    const seekTime = values[0];
    playerRef.current?.seekTo(seekTime, 'seconds');
    setCurrentTime(seekTime);
    selectSegmentByTime(seekTime);
  }, [setCurrentTime, selectSegmentByTime]);

  // Skip forward/backward
  const skipForward = useCallback(() => {
    const newTime = Math.min(video.currentTime + 10, video.duration);
    playerRef.current?.seekTo(newTime, 'seconds');
  }, [video.currentTime, video.duration]);

  const skipBackward = useCallback(() => {
    const newTime = Math.max(video.currentTime - 10, 0);
    playerRef.current?.seekTo(newTime, 'seconds');
  }, [video.currentTime]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            url={video.url}
            width="100%"
            height="auto"
            playing={video.isPlaying}
            onProgress={handleProgress}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            progressInterval={100}
            config={{
              file: {
                attributes: {
                  style: { width: '100%', height: 'auto' }
                }
              }
            }}
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