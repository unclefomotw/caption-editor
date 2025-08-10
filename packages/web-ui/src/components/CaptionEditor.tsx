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
  const [editingTimestampId, setEditingTimestampId] = useState<string | null>(
    null
  );
  const [editingTimestampType, setEditingTimestampType] = useState<
    'start' | 'end' | null
  >(null);
  const [editingTimestampValue, setEditingTimestampValue] = useState('');
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);

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

  // Parse time string into seconds
  const parseTime = (timeString: string): number | null => {
    const parts = timeString.split(':');
    if (parts.length < 2 || parts.length > 3) return null;

    let hours = 0,
      minutes = 0,
      seconds = 0;

    if (parts.length === 3) {
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
      seconds = parseFloat(parts[2]);
    } else {
      minutes = parseInt(parts[0], 10);
      seconds = parseFloat(parts[1]);
    }

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
    if (
      hours < 0 ||
      minutes < 0 ||
      minutes >= 60 ||
      seconds < 0 ||
      seconds >= 60
    )
      return null;

    return hours * 3600 + minutes * 60 + seconds;
  };

  // Handle timestamp edit start
  const handleEditTimestamp = useCallback(
    (segmentId: string, type: 'start' | 'end', currentValue: number) => {
      setEditingTimestampId(segmentId);
      setEditingTimestampType(type);
      setEditingTimestampValue(formatTime(currentValue));
    },
    []
  );

  // Handle timestamp save
  const handleSaveTimestamp = useCallback(() => {
    if (!editingTimestampId || !editingTimestampType) return;

    const parsedTime = parseTime(editingTimestampValue);
    if (parsedTime === null) {
      alert('Invalid time format. Use MM:SS.MS or HH:MM:SS.MS');
      return;
    }

    const segment = captionFile?.segments.find(
      (s) => s.id === editingTimestampId
    );
    if (!segment) return;

    // Validate time constraints
    if (editingTimestampType === 'start') {
      if (parsedTime >= segment.endTime) {
        alert('Start time must be less than end time');
        return;
      }
      updateSegment(editingTimestampId, { startTime: parsedTime });
    } else {
      if (parsedTime <= segment.startTime) {
        alert('End time must be greater than start time');
        return;
      }
      updateSegment(editingTimestampId, { endTime: parsedTime });
    }

    setEditingTimestampId(null);
    setEditingTimestampType(null);
    setEditingTimestampValue('');
  }, [
    editingTimestampId,
    editingTimestampType,
    editingTimestampValue,
    captionFile,
    updateSegment,
  ]);

  // Handle timestamp cancel
  const handleCancelTimestamp = useCallback(() => {
    setEditingTimestampId(null);
    setEditingTimestampType(null);
    setEditingTimestampValue('');
  }, []);

  // Check if a segment has overlap with adjacent segments
  const getSegmentOverlapInfo = useCallback(
    (segment: CaptionSegment, segments: CaptionSegment[]) => {
      const sortedSegments = segments.sort((a, b) => a.startTime - b.startTime);
      const currentIndex = sortedSegments.findIndex((s) => s.id === segment.id);

      const overlaps = {
        hasStartOverlap: false,
        hasEndOverlap: false,
        overlapsPrevious: false,
        overlapsNext: false,
      };

      // Check overlap with previous segment
      if (currentIndex > 0) {
        const previousSegment = sortedSegments[currentIndex - 1];
        if (previousSegment.endTime > segment.startTime) {
          overlaps.hasStartOverlap = true;
          overlaps.overlapsPrevious = true;
        }
      }

      // Check overlap with next segment
      if (currentIndex < sortedSegments.length - 1) {
        const nextSegment = sortedSegments[currentIndex + 1];
        if (segment.endTime > nextSegment.startTime) {
          overlaps.hasEndOverlap = true;
          overlaps.overlapsNext = true;
        }
      }

      return overlaps;
    },
    []
  );

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

  // Calculate timestamp for a new segment before or after a given segment
  const calculateNewSegmentTimestamp = useCallback(
    (targetSegment: CaptionSegment, position: 'before' | 'after') => {
      if (!captionFile) return { startTime: 0, endTime: 5 };

      const segments = captionFile.segments.sort(
        (a, b) => a.startTime - b.startTime
      );
      const targetIndex = segments.findIndex((s) => s.id === targetSegment.id);

      if (position === 'before') {
        const isFirstSegment = targetIndex === 0;
        const prevSegment = isFirstSegment ? null : segments[targetIndex - 1];

        const endTime = targetSegment.startTime; // Y's end timestamp is X's start timestamp

        if (isFirstSegment) {
          // Adding before the first segment
          const duration = Math.min(endTime, 5); // Duration <= 5 seconds when possible
          const startTime = endTime - duration; // Start from 0:00.00 or endTime - 5 seconds
          return { startTime: Math.max(0, startTime), endTime };
        } else {
          // Adding between segments Z and X
          const availableStart = prevSegment!.endTime; // Z's end timestamp
          const availableGap = endTime - availableStart;

          if (availableGap <= 5) {
            // Duration would be <= 5 seconds, use Z's end timestamp
            return { startTime: availableStart, endTime };
          } else {
            // Duration would be > 5 seconds, use endTime - 5 seconds
            return { startTime: endTime - 5, endTime };
          }
        }
      } else {
        // after
        const isLastSegment = targetIndex === segments.length - 1;
        const nextSegment = isLastSegment ? null : segments[targetIndex + 1];

        const startTime = targetSegment.endTime; // Y's start timestamp is X's end timestamp

        if (isLastSegment) {
          // Adding after the last segment
          return { startTime, endTime: startTime + 5 }; // Y's end timestamp is Y's start + 5 seconds
        } else {
          // Adding between segments X and Z
          const availableEnd = nextSegment!.startTime; // Z's start timestamp
          const availableGap = availableEnd - startTime;

          if (availableGap <= 5) {
            // Duration would be <= 5 seconds, use Z's start timestamp
            return { startTime, endTime: availableEnd };
          } else {
            // Duration would be > 5 seconds, use startTime + 5 seconds
            return { startTime, endTime: startTime + 5 };
          }
        }
      }
    },
    [captionFile]
  );

  // Handle adding a segment before or after another segment
  const handleAddSegmentNear = useCallback(
    (targetSegment: CaptionSegment, position: 'before' | 'after') => {
      const { startTime, endTime } = calculateNewSegmentTimestamp(
        targetSegment,
        position
      );

      const newSegment: CaptionSegment = {
        id: `segment_${Date.now()}`,
        startTime,
        endTime,
        text: '',
      };

      addSegment(newSegment);
      selectSegment(newSegment.id);
    },
    [calculateNewSegmentTimestamp, addSegment, selectSegment]
  );

  // Check if add segment buttons should be disabled
  const getAddSegmentButtonStates = useCallback(
    (targetSegment: CaptionSegment) => {
      if (!captionFile) return { beforeDisabled: false, afterDisabled: false };

      const segments = captionFile.segments.sort(
        (a, b) => a.startTime - b.startTime
      );
      const targetIndex = segments.findIndex((s) => s.id === targetSegment.id);

      let beforeDisabled = false;
      let afterDisabled = false;

      // Check if "before" button should be disabled
      if (targetIndex > 0) {
        const prevSegment = segments[targetIndex - 1];
        // Disable if Y's end timestamp equals X's start timestamp
        beforeDisabled = prevSegment.endTime === targetSegment.startTime;
      } else {
        // X is the first segment - disable if X's start timestamp is 0
        beforeDisabled = targetSegment.startTime === 0;
      }

      // Check if "after" button should be disabled
      if (targetIndex < segments.length - 1) {
        const nextSegment = segments[targetIndex + 1];
        // Disable if Y's start timestamp equals X's end timestamp
        afterDisabled = nextSegment.startTime === targetSegment.endTime;
      }

      return { beforeDisabled, afterDisabled };
    },
    [captionFile]
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
            <p className="text-sm text-gray-600">{segments.length} segments</p>
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
              const isEditingTimestamp = editingTimestampId === segment.id;
              const overlapInfo = getSegmentOverlapInfo(segment, segments);

              return (
                <div
                  key={segment.id}
                  ref={isSelected ? selectedSegmentRef : null}
                  className={`relative p-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-100 border-l-4 border-blue-500 shadow-sm transform translate-x-1'
                      : 'hover:bg-gray-50 hover:translate-x-0.5'
                  }`}
                  onClick={() =>
                    !isEditing &&
                    !isEditingTimestamp &&
                    handleSegmentClick(segment)
                  }
                  onMouseEnter={() => setHoveredSegmentId(segment.id)}
                  onMouseLeave={() => setHoveredSegmentId(null)}
                >
                  {/* Add Segment Buttons */}
                  {hoveredSegmentId === segment.id &&
                    (() => {
                      const { beforeDisabled, afterDisabled } =
                        getAddSegmentButtonStates(segment);
                      return (
                        <>
                          {/* Add Segment Before Button */}
                          <button
                            className={`absolute -top-0.5 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium shadow-lg transition-all duration-200 flex items-center space-x-1 z-10 ${
                              beforeDisabled
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!beforeDisabled) {
                                handleAddSegmentNear(segment, 'before');
                              }
                            }}
                            disabled={beforeDisabled}
                            title={
                              beforeDisabled
                                ? 'Cannot add segment - no gap available'
                                : 'Add segment before this one'
                            }
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Segment</span>
                          </button>
                          {/* Add Segment After Button */}
                          <button
                            className={`absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium shadow-lg transition-all duration-200 flex items-center space-x-1 z-10 ${
                              afterDisabled
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!afterDisabled) {
                                handleAddSegmentNear(segment, 'after');
                              }
                            }}
                            disabled={afterDisabled}
                            title={
                              afterDisabled
                                ? 'Cannot add segment - no gap available'
                                : 'Add segment after this one'
                            }
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Segment</span>
                          </button>
                        </>
                      );
                    })()}
                  <div className="flex items-start justify-between">
                    {/* Timing and Content */}
                    <div className="flex-1 mr-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <div className="font-mono flex items-center space-x-2">
                          {isEditingTimestamp &&
                          editingTimestampType === 'start' ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={editingTimestampValue}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Only allow digits, colons, and periods
                                  if (/^[0-9:.]*$/.test(value)) {
                                    setEditingTimestampValue(value);
                                  }
                                }}
                                className="w-20 px-1 py-0.5 border rounded text-xs"
                                placeholder="0:00.00"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveTimestamp();
                                  } else if (e.key === 'Escape') {
                                    handleCancelTimestamp();
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0"
                                onClick={handleSaveTimestamp}
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0"
                                onClick={handleCancelTimestamp}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <span
                              className={`cursor-pointer hover:bg-gray-200 px-1 rounded ${
                                overlapInfo.hasStartOverlap
                                  ? 'bg-red-100 text-red-700 border border-red-300'
                                  : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTimestamp(
                                  segment.id,
                                  'start',
                                  segment.startTime
                                );
                              }}
                              title={
                                overlapInfo.hasStartOverlap
                                  ? 'Warning: This segment overlaps with the previous segment'
                                  : undefined
                              }
                            >
                              {formatTime(segment.startTime)}
                            </span>
                          )}
                          <span>→</span>
                          {isEditingTimestamp &&
                          editingTimestampType === 'end' ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={editingTimestampValue}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Only allow digits, colons, and periods
                                  if (/^[0-9:.]*$/.test(value)) {
                                    setEditingTimestampValue(value);
                                  }
                                }}
                                className="w-20 px-1 py-0.5 border rounded text-xs"
                                placeholder="0:00.00"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveTimestamp();
                                  } else if (e.key === 'Escape') {
                                    handleCancelTimestamp();
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0"
                                onClick={handleSaveTimestamp}
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0"
                                onClick={handleCancelTimestamp}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <span
                              className={`cursor-pointer hover:bg-gray-200 px-1 rounded ${
                                overlapInfo.hasEndOverlap
                                  ? 'bg-red-100 text-red-700 border border-red-300'
                                  : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTimestamp(
                                  segment.id,
                                  'end',
                                  segment.endTime
                                );
                              }}
                              title={
                                overlapInfo.hasEndOverlap
                                  ? 'Warning: This segment overlaps with the next segment'
                                  : undefined
                              }
                            >
                              {formatTime(segment.endTime)}
                            </span>
                          )}
                        </div>
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
