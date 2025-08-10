# ReactPlayer Reality Guide: What Actually Works vs Documentation

## Overview

This document captures the real-world experience of implementing ReactPlayer v3.3.1 in a Next.js 15.4.6 + TypeScript project, highlighting discrepancies between official documentation and actual implementation requirements.

## TL;DR - What Actually Works

```tsx
import ReactPlayer from 'react-player';

// ✅ CORRECT Implementation for react-player@3.3.1
<ReactPlayer
  ref={playerRef}
  src={videoUrl} // ✅ Use 'src', not 'url'
  playing={isPlaying}
  onTimeUpdate={handleTimeUpdate} // ✅ HTML5 event, not ReactPlayer callback
  onDurationChange={handleDurationChange} // ✅ HTML5 event, not ReactPlayer callback
  onPlay={handlePlay}
  onError={handleError}
  controls={false}
/>;

// ✅ CORRECT Event Handlers
const handleTimeUpdate = useCallback(
  (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = event.target as HTMLVideoElement;
    const currentTime = target.currentTime;
    setCurrentTime(currentTime);
  },
  [setCurrentTime]
);

const handleDurationChange = useCallback(
  (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = event.target as HTMLVideoElement;
    const duration = target.duration;
    setVideoDuration(duration);
  },
  [setVideoDuration]
);

// ✅ CORRECT Seeking
const handleSeek = (seekTime: number) => {
  if (playerRef.current) {
    playerRef.current.currentTime = seekTime; // HTMLMediaElement interface
  }
};
```

## Documentation Analysis

### 📚 What Documentation Sources Say vs Reality

#### 1. GitHub README (https://github.com/cookpete/react-player)

**What it Claims:**

```
onDurationChange: Callback containing duration of the media, in seconds
onTimeUpdate: Called when the media's current time changes
```

**Reality for v3.3.1:**

- These are **HTML5 video events**, not ReactPlayer-specific callbacks
- They receive `SyntheticEvent<HTMLVideoElement>`, not direct values
- You must extract values from `event.target.duration` and `event.target.currentTime`

#### 2. Migration Guide Claims

**What it Claims:**

```
onProgress => onTimeUpdate and onProgress
onDuration => onDurationChange
```

**Reality:**

- ✅ `onDurationChange` exists but as HTML5 event
- ✅ `onTimeUpdate` exists but as HTML5 event
- ❌ ReactPlayer-specific `onProgress` doesn't trigger in our version
- ❌ Custom callback signatures don't match documentation

#### 3. Context7/MCP Documentation

**What it Claims:**

- Shows ReactPlayer v3.x API with direct parameter callbacks
- Examples show `onReady` receiving player instance
- Shows `getInternalPlayer()` method availability

**Reality:**

- ✅ `onReady` exists and works (no parameters)
- ❌ `getInternalPlayer()` method doesn't exist in our version
- ❌ Direct parameter callbacks don't work as documented

## What Actually Works in react-player@3.3.1

### ✅ Props That Work

```tsx
src: string                    // ✅ Video URL (NOT 'url')
playing: boolean              // ✅ Play/pause control
controls: boolean             // ✅ Show/hide native controls
width: string | number        // ✅ Player width
height: string | number       // ✅ Player height
onPlay: () => void           // ✅ Play event callback
onPause: () => void          // ✅ Pause event callback
onError: (error: any) => void // ✅ Error callback
```

### ✅ HTML5 Video Events That Work

```tsx
onTimeUpdate: (event: SyntheticEvent<HTMLVideoElement>) => void
onDurationChange: (event: SyntheticEvent<HTMLVideoElement>) => void
onLoadedMetadata: (event: SyntheticEvent<HTMLVideoElement>) => void
onCanPlay: (event: SyntheticEvent<HTMLVideoElement>) => void
```

### ✅ Ref Methods That Work (HTMLMediaElement Interface)

```tsx
playerRef.current.currentTime = number; // ✅ Seeking
playerRef.current.play(); // ✅ Play
playerRef.current.pause(); // ✅ Pause
playerRef.current.duration; // ✅ Get duration (readonly)
```

### ❌ What DOESN'T Work (Despite Documentation)

```tsx
// ❌ These don't exist in our version:
playerRef.current.seekTo(time, 'seconds')
playerRef.current.getDuration()
playerRef.current.getInternalPlayer()

// ❌ These callback signatures don't work:
onDurationChange: (duration: number) => void
onTimeUpdate: (state: { playedSeconds: number }) => void

// ❌ This prop name doesn't work:
url={videoUrl}  // Use 'src' instead
```

## Debugging Process & Lessons Learned

### 1. Documentation Can Be Misleading

- **Lesson**: Official documentation may describe "ideal" API that isn't fully implemented
- **Solution**: Always check installed TypeScript definitions: `node_modules/react-player/dist/types.d.ts`

### 2. Version Mismatches Are Common

- **Problem**: GitHub README shows v3.x API, but installed version uses different implementation
- **Solution**: Trust TypeScript errors over documentation when they conflict

### 3. ReactPlayer is a Wrapper Around HTML5 Video

- **Key Insight**: ReactPlayer ultimately creates an HTML5 `<video>` element
- **Implication**: HTML5 video events and properties are more reliable than ReactPlayer-specific APIs

### 4. Event Handler Signatures Matter

- **Problem**: Documentation showed `onDurationChange: (duration: number)`
- **Reality**: Actual signature is `onDurationChange: (event: SyntheticEvent<HTMLVideoElement>)`
- **Solution**: Use TypeScript to guide correct implementation

## Debugging Steps That Worked

### 1. Check Actual TypeScript Definitions

```bash
# Find the real type definitions
find node_modules/react-player -name "*.d.ts"
cat node_modules/react-player/dist/types.d.ts
```

### 2. DOM Inspection

- Check if `<video>` element exists: `document.querySelector('video')`
- Verify video attributes: `videoElement.src`, `videoElement.duration`
- Monitor video events in browser DevTools

### 3. Incremental Testing

1. ✅ First get basic video loading working
2. ✅ Then add duration detection
3. ✅ Then add progress tracking
4. ✅ Finally add seeking functionality

### 4. Trust TypeScript Errors

- When TypeScript says "Property 'url' does not exist", believe it
- When it expects `SyntheticEvent` but you provide `number`, listen to it
- Use TypeScript as ground truth over documentation

## Working Example (Complete)

```tsx
import React, { useRef, useCallback, useState } from 'react';
import ReactPlayer from 'react-player';

export function VideoPlayer() {
  const playerRef = useRef<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    },
    []
  );

  const handleTimeUpdate = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const target = event.target as HTMLVideoElement;
      setCurrentTime(target.currentTime);
    },
    []
  );

  const handleDurationChange = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const target = event.target as HTMLVideoElement;
      if (target.duration && target.duration > 0) {
        setDuration(target.duration);
      }
    },
    []
  );

  const handleSeek = useCallback((seekTime: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = seekTime;
    }
  }, []);

  return (
    <div>
      {!videoUrl ? (
        <div>
          <input type="file" accept="video/*" onChange={handleFileUpload} />
        </div>
      ) : (
        <div>
          <ReactPlayer
            ref={playerRef}
            src={videoUrl}
            playing={isPlaying}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls={false}
          />
          <div>
            <button onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <span>
              {Math.floor(currentTime)}s / {Math.floor(duration)}s
            </span>
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

## Recommendations for Future Developers

### 1. Don't Trust Documentation Blindly

- Verify API compatibility with your specific version
- Check TypeScript definitions in `node_modules`
- Test incrementally rather than implementing full features at once

### 2. Understand the Underlying Technology

- ReactPlayer wraps HTML5 video elements
- Learn HTML5 video API as fallback knowledge
- Use browser DevTools to inspect actual DOM elements

### 3. Use TypeScript as Your Guide

- TypeScript errors often reveal documentation inaccuracies
- Let type checking guide your implementation
- Use `any` sparingly and only when you understand why types are wrong

### 4. Version Pin for Stability

```json
{
  "dependencies": {
    "react-player": "3.3.1" // Pin exact version, don't use ^3.3.1
  }
}
```

### 5. Keep Debugging Logs During Development

```tsx
useEffect(() => {
  if (videoUrl) {
    setTimeout(() => {
      const video = document.querySelector('video');
      console.log('Video element:', {
        src: video?.src,
        duration: video?.duration,
        readyState: video?.readyState,
      });
    }, 1000);
  }
}, [videoUrl]);
```

## Conclusion

ReactPlayer v3.3.1 works well for basic video playback, but the documentation doesn't match the actual implementation. The key is to:

1. **Use HTML5 video events** instead of expecting ReactPlayer-specific callbacks
2. **Trust TypeScript definitions** over online documentation
3. **Understand it's a wrapper** around standard HTML5 video elements
4. **Test incrementally** and verify each feature works before adding complexity

The working solution uses standard HTML5 video event patterns, which are more reliable and better documented than ReactPlayer's custom API layer.
