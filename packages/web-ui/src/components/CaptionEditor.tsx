'use client';

import { Button } from '@/components/ui/button';
import { useCaptionStore } from '@/stores/caption-store';
import { Combine, Edit3, Plus, Save, Scissors, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CaptionSegment } from '../../../common-types/src/types';

interface CaptionEditorProps {
  className?: string;
}

export function CaptionEditor({ className }: CaptionEditorProps) {
  const {
    captionFile,
    selectedSegmentId,
    video,
    isEditing,
    addSegment,
    updateSegment,
    deleteSegment,
    splitSegment,
    mergeSegments,
    selectSegment,
    setIsPlaying,
    setCurrentTime,
  } = useCaptionStore();

  const segmentListRef = useRef<HTMLDivElement>(null);
  const selectedSegmentRef = useRef<HTMLDivElement>(null);

  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Handle segment click - seek video to segment start
  const handleSegmentClick = useCallback(
    (segment: CaptionSegment) => {
      selectSegment(segment.id);
      setCurrentTime(segment.startTime);

      // Also seek the video element directly
      const videoElement = document.querySelector('video');
      if (videoElement) {
        videoElement.currentTime = segment.startTime;
      }

      setIsPlaying(true);
    },
    [selectSegment, setCurrentTime, setIsPlaying]
  );

  // Auto-scroll to selected segment
  useEffect(() => {
    if (
      selectedSegmentId &&
      selectedSegmentRef.current &&
      segmentListRef.current
    ) {
      const segmentElement = selectedSegmentRef.current;
      const listElement = segmentListRef.current;

      const segmentTop = segmentElement.offsetTop;
      const segmentHeight = segmentElement.offsetHeight;
      const listScrollTop = listElement.scrollTop;
      const listHeight = listElement.clientHeight;

      // Check if segment is outside the visible area
      if (
        segmentTop < listScrollTop ||
        segmentTop + segmentHeight > listScrollTop + listHeight
      ) {
        // Scroll to center the segment in the visible area
        const targetScrollTop = segmentTop - listHeight / 2 + segmentHeight / 2;
        listElement.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth',
        });
      }
    }
  }, [selectedSegmentId]);

  // Handle edit segment
  const handleEditSegment = useCallback((segment: CaptionSegment) => {
    setEditingSegmentId(segment.id);
    setEditingText(segment.text);
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(() => {
    if (editingSegmentId) {
      updateSegment(editingSegmentId, { text: editingText });
      setEditingSegmentId(null);
      setEditingText('');
    }
  }, [editingSegmentId, editingText, updateSegment]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingSegmentId(null);
    setEditingText('');
  }, []);

  // Handle add new segment
  const handleAddSegment = useCallback(() => {
    const newSegment: CaptionSegment = {
      id: `segment_${Date.now()}`,
      startTime: video.currentTime,
      endTime: video.currentTime + 3, // Default 3-second duration
      text: 'New caption',
    };
    addSegment(newSegment);
    selectSegment(newSegment.id);
  }, [video.currentTime, addSegment, selectSegment]);

  // Handle split segment at current time
  const handleSplitSegment = useCallback(
    (segmentId: string) => {
      splitSegment(segmentId, video.currentTime);
    },
    [video.currentTime, splitSegment]
  );

  // Handle merge with next segment
  const handleMergeSegment = useCallback(
    (segment: CaptionSegment, segments: CaptionSegment[]) => {
      const currentIndex = segments.findIndex((s) => s.id === segment.id);
      const nextSegment = segments[currentIndex + 1];

      if (nextSegment) {
        mergeSegments(segment.id, nextSegment.id);
      }
    },
    [mergeSegments]
  );

  if (!captionFile) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No captions loaded
          </h3>
          <p className="text-gray-500 mb-4">
            Upload a video and generate captions to start editing
          </p>
          <Button
            onClick={handleAddSegment}
            disabled={!video.isReady}
            className="mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Caption
          </Button>
        </div>
      </div>
    );
  }

  const segments = captionFile.segments.sort(
    (a, b) => a.startTime - b.startTime
  );

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Caption Editor</h2>
            <p className="text-sm text-gray-600">
              {segments.length} segments • {captionFile.language} •{' '}
              {captionFile.format?.toUpperCase()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleAddSegment} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Segment
            </Button>
          </div>
        </div>
      </div>

      {/* Segments List */}
      <div ref={segmentListRef} className="max-h-[720px] overflow-y-auto">
        {segments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">✨</div>
            <p>No caption segments yet.</p>
            <Button onClick={handleAddSegment} size="sm" className="mt-3">
              <Plus className="w-4 h-4 mr-2" />
              Add First Segment
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {segments.map((segment, index) => {
              const isSelected = segment.id === selectedSegmentId;
              const isEditing = segment.id === editingSegmentId;

              return (
                <div
                  key={segment.id}
                  ref={isSelected ? selectedSegmentRef : null}
                  className={`p-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-100 border-l-4 border-blue-500 shadow-sm transform translate-x-1'
                      : 'hover:bg-gray-50 hover:translate-x-0.5'
                  }`}
                  onClick={() => !isEditing && handleSegmentClick(segment)}
                >
                  <div className="flex items-start justify-between">
                    {/* Timing and Content */}
                    <div className="flex-1 mr-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <span className="font-mono">
                          {formatTime(segment.startTime)} →{' '}
                          {formatTime(segment.endTime)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>
                          {(segment.endTime - segment.startTime).toFixed(1)}s
                        </span>
                        {segment.confidence && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span
                              className={
                                segment.confidence > 0.8
                                  ? 'text-green-600'
                                  : segment.confidence > 0.6
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                              }
                            >
                              {Math.round(segment.confidence * 100)}%
                            </span>
                          </>
                        )}
                        {segment.speaker && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-purple-600">
                              {segment.speaker}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Text Content */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-2 border rounded text-sm resize-none"
                            rows={2}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                handleSaveEdit();
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-900 leading-relaxed">
                          {segment.text || (
                            <em className="text-gray-400">Empty caption</em>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {!isEditing && (
                      <div className="flex flex-col space-y-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSegment(segment);
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSplitSegment(segment.id);
                          }}
                          disabled={
                            video.currentTime <= segment.startTime ||
                            video.currentTime >= segment.endTime
                          }
                        >
                          <Scissors className="w-3 h-3" />
                        </Button>

                        {index < segments.length - 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMergeSegment(segment, segments);
                            }}
                          >
                            <Combine className="w-3 h-3" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSegment(segment.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {isEditing && (
        <div className="p-4 border-t bg-yellow-50">
          <div className="flex items-center text-sm text-yellow-800">
            <Edit3 className="w-4 h-4 mr-2" />
            You have unsaved changes. Remember to save your work!
          </div>
        </div>
      )}
    </div>
  );
}
