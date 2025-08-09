'use client';

import { useState, useEffect } from 'react';
import { useCaptionStore } from '@/stores/caption-store';
import { getStorageSizeInMB, clearStoredVideo } from '@/utils/persistence';
import { Button } from '@/components/ui/button';
import { HardDrive, Trash2, RefreshCw } from 'lucide-react';

export function StorageStatus() {
  const { video, captionFile, clearVideoStorage } = useCaptionStore();
  const [storageSize, setStorageSize] = useState(0);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const calculateSize = () => {
      // Only caption data is stored (videos are never stored)
      const captionSize = captionFile ? 
        Math.round(JSON.stringify(captionFile).length / 1024 * 100) / 100 : 0; // KB, not MB
      
      setStorageSize(captionSize);
    };

    calculateSize();
  }, [captionFile]);

  const handleClearStorage = async () => {
    if (!confirm('Clear all stored data? This will remove your saved video and captions.')) {
      return;
    }

    setIsClearing(true);
    
    try {
      // Clear from Zustand store
      clearVideoStorage();
      
      // Clear from localStorage directly
      clearStoredVideo();
      
      // Update size display
      setStorageSize(0);
    } catch (error) {
      console.error('Error clearing storage:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Always show if there's a video loaded (even if not stored) or captions exist
  if (!video.url && !captionFile) {
    return null; // Don't show if nothing is loaded
  }

  return (
    <div className="bg-gray-50 rounded-lg border p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-600">
          <HardDrive className="w-4 h-4" />
          <span>
            {storageSize > 0 ? `Caption data: ${storageSize.toFixed(1)}KB` : 'No captions to save'}
          </span>
          {captionFile && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              Captions auto-saved
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {storageSize > 50 && (
            <span className="text-xs text-orange-600">
              Large storage usage
            </span>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearStorage}
            disabled={isClearing}
            className="text-gray-500 hover:text-red-600"
          >
            {isClearing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>
      
      {(video.fileName || captionFile) && (
        <div className="mt-2 text-xs text-gray-500">
          {video.fileName && `Current video: ${video.fileName}`}
          {captionFile && (
            <span>{video.fileName ? ' • ' : ''}{captionFile.segments.length} saved caption segments</span>
          )}
        </div>
      )}
    </div>
  );
}