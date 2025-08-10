# Caption Editor - Claude Development Notes

## Project Overview

Building a web application for editing video captions with AI-powered transcription capabilities.

## Tech Stack Implemented

### Frontend (packages/web-ui)

- **Next.js 15.4.6** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** components library
- **App Router** with src directory structure

### Backend (packages/api-server)

- **FastAPI** with Python 3.11+
- **Poetry** for dependency management. Use Poetry 2.1
- **Pydantic** for data validation
- **Uvicorn** ASGI server for development
- **AssemblyAI SDK v0.42.1** for AI transcription (FULLY IMPLEMENTED)
- **Docker Compose** development environment with environment variable passthrough

### Shared Types (packages/common-types)

- **JSON Schema** for data structure definitions
- **TypeScript generation** from JSON schemas
- **Workspace linking** for type sharing across packages

### Monorepo Setup

- **Turborepo** for build orchestration
- **npm workspaces** for JavaScript packages
- **Poetry** for Python package management

## Current Status

### ✅ Completed

1. **Monorepo structure** with proper workspace configuration
2. **Next.js frontend** with Shadcn/ui setup - fully functional
3. **FastAPI backend** with complete router structure and dependencies
4. **JSON schemas** and TypeScript type generation system
5. **Turborepo** build orchestration with proper pipeline
6. **Type generation** scripts with automated build integration
7. **🎉 VideoPlayer component** - FULLY WORKING with video playback, duration detection, and seeking
8. **🎉 Video file upload system** - Complete with blob URL creation and validation
9. **🎉 Zustand state management** - Properly integrated with video player state
10. **🎉 CaptionEditor component** - FULLY WORKING with real-time video synchronization
11. **🎉 Bidirectional video/caption synchronization** - Real-time sync with click-to-seek and smooth auto-scrolling
12. **🎉 Caption file import/export (VTT/SRT)** - Custom parsers with UTF-8 support and robust time format handling
13. **🎉 localStorage persistence for work recovery** - Conditional caption restoration with exact file metadata matching
14. **🎉 AssemblyAI Backend Integration** - Real AI transcription with async job processing and word-level timestamps
15. **🎉 Docker Development Environment** - Full-stack setup with environment variable passthrough and hot reload
16. **🎉 AI Transcription UI Integration** - Complete workflow from video upload to AI caption generation
17. **🎉 Advanced Caption Editing** - Click-to-edit timestamps, hover-based segment addition, merge functionality, overlap warnings

### v0.1.1

- Interactive timestamp editing with validation
- Hover-based segment management (add before/after with smart positioning)
- Segment merging with collision-free UI
- Visual overlap detection between segments
- Empty caption initialization
- Detailed editor specification (see @docs/spec/editor_spec.txt)

## How to Run/Test

### Docker Compose (RECOMMENDED for Full Stack Development)

```bash
# PREREQUISITE: Export AssemblyAI API Key
export ASSEMBLYAI_API_KEY="your-actual-api-key-here"

# Start both frontend and backend in Docker
npm run docker:dev
```

- ✅ **Frontend**: http://localhost:3000 (Next.js with hot reload)
- ✅ **Backend**: http://localhost:8000 (FastAPI with AssemblyAI integration)
- ✅ **API Docs**: http://localhost:8000/docs
- ✅ **Complete environment** with all dependencies and AI functionality

### Native Development (Alternative)

```bash
# Frontend only (fastest hot reload)
cd packages/web-ui
npm run dev

# Backend (requires ASSEMBLYAI_API_KEY exported)
cd packages/api-server
poetry run uvicorn caption_editor_api.main:app --reload
```

### Testing AssemblyAI Backend Integration

```bash
# 1. Test video upload
curl -X POST "http://localhost:8000/api/videos/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/video.mp4"

# 2. Start transcription (use video_id from upload response)
curl -X POST "http://localhost:8000/api/captions/transcribe" \
  -H "Content-Type: application/json" \
  -d '{"video_id": "VIDEO_ID_FROM_UPLOAD"}'

# 3. Check transcription status (use job_id from transcribe response)
curl "http://localhost:8000/api/captions/transcribe/JOB_ID_FROM_START"
```

### Build Commands

```bash
npm run build        # Build all packages (includes type generation)
npm run lint         # Lint all packages
npm run generate-types  # Generate TypeScript types from JSON schemas only
```

## Project Structure

```
caption-editor/
├── package.json          # Workspace root
├── turbo.json           # Turborepo config
├── pyproject.toml       # Python workspace root
├── CLAUDE.md            # Development notes
└── packages/
    ├── web-ui/          # Next.js frontend (COMPLETE)
    │   └── src/
    │       ├── app/            # Next.js app router
    │       ├── components/     # UI components
    │       ├── stores/         # Zustand state management
    │       └── utils/          # VTT/SRT parsers, file helpers
    ├── api-server/      # FastAPI backend (COMPLETE)
    │   └── src/caption_editor_api/
    │       ├── main.py         # FastAPI app
    │       └── routers/        # API endpoints
    └── common-types/    # Shared schemas (COMPLETE)
        ├── schemas/            # JSON schema definitions
        ├── scripts/            # Type generation automation
        └── src/types/          # Generated TypeScript types
```

## Rules for Successors

### Development Workflow

1. **Always run commands from project root** when using Turborepo
2. **Use workspace commands**: `npm run dev` instead of individual package commands
3. **Test both frontend and backend** after making changes
4. **Generate types after schema changes**: Run `npm run build` to regenerate TypeScript types

### Code Standards

1. **Follow existing file structure** - Raise your justification before creating new top-level directories
2. **Use TypeScript** for all frontend code with strict typing
3. **Use Poetry 2.1** for Python dependency management (not pip/venv)
4. **Keep monorepo workspace clean** - dependencies belong in individual packages
5. **Import types from common-types**: Always use shared types for consistency

### Type System Rules

1. **Modify schemas, not generated types** - Edit `.json` files, not `.ts` files
2. **Run type generation after schema changes** - `npm run build` or `npm run generate-types`
3. **Use shared types everywhere** - Import from `@caption-editor/common-types`
4. **Don't create duplicate type definitions** - Use the shared schemas

### 🚨 CRITICAL ReactPlayer Implementation Rules

**MUST READ**: ReactPlayer v3.3.1 documentation is misleading. Follow these patterns:

1. **Use HTML5 event signatures, NOT ReactPlayer callbacks**:

   ```tsx
   // ✅ CORRECT - HTML5 events
   onTimeUpdate={(event: React.SyntheticEvent<HTMLVideoElement>) => {
     const currentTime = (event.target as HTMLVideoElement).currentTime;
   }}
   onDurationChange={(event: React.SyntheticEvent<HTMLVideoElement>) => {
     const duration = (event.target as HTMLVideoElement).duration;
   }}

   // ❌ WRONG - Don't trust documentation showing:
   onTimeUpdate={(state: { playedSeconds: number }) => ...}
   onDurationChange={(duration: number) => ...}
   ```

2. **Use correct prop names**:

   ```tsx
   <ReactPlayer
     src={videoUrl} // ✅ CORRECT - use 'src'
     url={videoUrl} // ❌ WRONG - will cause TypeScript errors
   />
   ```

3. **Use HTMLMediaElement interface for player control**:

   ```tsx
   // ✅ CORRECT - HTMLMediaElement methods
   playerRef.current.currentTime = seekTime;
   playerRef.current.play();
   playerRef.current.pause();

   // ❌ WRONG - These don't exist:
   playerRef.current.seekTo(time);
   playerRef.current.getDuration();
   playerRef.current.getInternalPlayer();
   ```

4. **Trust TypeScript errors over online documentation** - Our version uses different API than GitHub README shows

5. **Flashing bug** - set `loop={false}` to prevent flashing

6. **🚨 VIDEO END LOOP BUG**: ReactPlayer can get stuck in rapid play/pause cycling when video ends
   - **Symptoms**: Console spam of "onPlay"/"onPause", video flickers, UI becomes unresponsive
   - **Root cause**: `onEnded` → state change → ReactPlayer re-render → `onPlay`/`onPause` → infinite loop
   - **Solution**: Use ref flag to block event handlers during video end transition:

   ```tsx
   const isEndingRef = useRef(false);

   const handleEnded = useCallback(() => {
     isEndingRef.current = true;
     setIsPlaying(false);
     // Clear flag after delay
     setTimeout(() => {
       isEndingRef.current = false;
     }, 100);
   }, [setIsPlaying]);

   const handlePlay = useCallback(() => {
     if (!isEndingRef.current && !video.isPlaying) {
       setIsPlaying(true);
     }
   }, [setIsPlaying, video.isPlaying]);
   ```

   - **Critical**: Don't remove this protection or the bug will return
   - **Note**: Browser AbortError during end transition is harmless and can be ignored

See @docs/reactplayer-reality-guide.md for complete details.

### 🚨 CRITICAL Advanced Caption Editing Implementation Rules

**MUST READ**: Interactive editing patterns implemented in v0.1.1:

1. **Click-to-edit timestamps**: Direct timestamp editing with HH:MM:SS.mmm format validation
2. **Hover-based segment controls**: Add before/after buttons with smart gap detection and positioning logic
3. **Merge segments**: Combines adjacent segments with collision-free button positioning
4. **Overlap warnings**: Visual indicators when segments have timing conflicts

See @docs/spec/editor_spec.txt for details

### 🚨 CRITICAL Bidirectional Synchronization Implementation Rules

**MUST READ**: Key patterns for maintaining video/caption sync that have been tested and verified:

1. **Use HTML5 video element for direct seeking**:

   ```tsx
   // When clicking caption segments
   const videoElement = document.querySelector("video");
   if (videoElement) {
     videoElement.currentTime = segment.startTime;
   }
   ```

2. **Implement smooth auto-scrolling with refs**:

   ```tsx
   const segmentListRef = useRef<HTMLDivElement>(null);
   const selectedSegmentRef = useRef<HTMLDivElement>(null);

   // Auto-scroll selected segment into view
   useEffect(() => {
     if (selectedSegmentId && selectedSegmentRef.current) {
       // Calculate scroll position and use smooth scrolling
     }
   }, [selectedSegmentId]);
   ```

3. **Enhanced visual feedback for active segments**:
   ```tsx
   className={`${
     isSelected
       ? 'bg-blue-100 border-l-4 border-blue-500 shadow-sm transform translate-x-1'
       : 'hover:bg-gray-50 hover:translate-x-0.5'
   }`}
   ```

### 🚨 CRITICAL VTT/SRT Parsing Implementation Rules

**Custom parser implementation** (keep the chance to use third-party libraries open)

1. **Parser location**: `src/utils/caption-parsers.ts`
2. **Key functions**:
   - `parseVTT(content, fileName)` - Handles WebVTT format, WEBVTT header, NOTE blocks
   - `parseSRT(content, fileName)` - Handles SubRip format with sequence numbers
   - `exportToVTT(captionFile)` - Generates compliant WebVTT output
   - `exportToSRT(captionFile)` - Generates compliant SubRip output

3. **Critical parsing features**:
   - **UTF-8 BOM removal**: `content.replace(/^\uFEFF/, '')`
   - **Multiple time formats**: HH:MM:SS.mmm, MM:SS.mmm, SS.mmm
   - **SRT comma format**: Converts `HH:MM:SS,mmm` to `HH:MM:SS.mmm`
   - **Multi-line caption support**: Concatenates text across lines

4. **File I/O patterns**:

   ```tsx
   // Import: File dialog → text() → parse → setCaptionFile()
   const file = await openFileDialog(".vtt,.srt");
   const content = await file.text();
   const captionData = file.name.endsWith(".vtt")
     ? parseVTT(content)
     : parseSRT(content);

   // Export: captionFile → format → download
   const vttContent = exportToVTT(captionFile);
   downloadFile(vttContent, "captions.vtt", "text/vtt");
   ```

### 🚨 CRITICAL localStorage Persistence Implementation Rules

**FULLY WORKING** - Implements complete recovery spec with all edge cases handled:

1. **Recovery specification** (See @docs/spec/recovery_spec.txt for details):
   - ✅ **No auto-restore on startup**: Captions cleared from UI on app launch
   - ✅ **Conditional restore for same file**: Captions restore when EXACT same video uploaded
   - ✅ **No restore for different file**: Captions stay cleared for different videos

2. **File metadata matching**:

   ```typescript
   interface VideoFileMetadata {
     name: string; // Exact filename match required
     size: number; // Byte-perfect size match required
     lastModified: number; // Exact timestamp match required
   }
   ```

3. **Critical implementation patterns**:

   ```typescript
   // Store caption data AND file metadata together
   const persistedState = {
     captionFile: state.captionFile,
     videoFileMetadata: state.video.fileMetadata,
     lastSaved: state.lastSaved,
   };

   // Reset captionsCleared flag on successful operations
   setCaptionFile: (captionFile) => {
     set({ captionFile, captionsCleared: false });
   };

   // Preserve localStorage during startup clearing
   if (state.captionsCleared && state.captionFile === null) {
     const existingData = localStorage.getItem("caption-editor-store");
     // Preserve both captionFile AND videoFileMetadata
   }
   ```

4. **Edge case handling**:
   - **Startup clearing preserves data**: App startup clears UI but keeps localStorage intact
   - **Recovery re-enables persistence**: Restored captions immediately become persistable
   - **Multiple recovery cycles**: Works across unlimited browser open/close cycles
   - **Different video protection**: Stored captions preserved even when different videos loaded

5. **Key store location**: `src/stores/caption-store.ts` with Zustand persist middleware
6. **localStorage key**: `caption-editor-store`
7. **Debugging**: Console logs with 🔧 🔍 ✅ ❌ prefixes for persistence tracking

### 🚨 CRITICAL Code Maintenance Traps

**LESSONS LEARNED** - Common pitfalls that will break functionality:

1. **Don't over-engineer debugging**:
   - **Trap**: Adding excessive console.log statements during development
   - **Risk**: Code becomes unreadable and harder to debug actual issues
   - **Solution**: Keep minimal, focused logging only for critical paths

2. **Don't remove video end protection**:
   - **Trap**: Simplifying event handlers by removing `isEndingRef` checks
   - **Risk**: Video end loop bug returns immediately
   - **Solution**: Always keep the ref-based protection in `handlePlay`/`handlePause`/`handleEnded`

3. **Don't force video seeking on end**:
   - **Trap**: Adding `currentTime = 0` or `setCurrentTime(0)` in `handleEnded`
   - **Risk**: Causes browser AbortError and potential state conflicts
   - **Solution**: Let video naturally stay at end position

4. **Don't trust ReactPlayer documentation**:
   - **Trap**: Following GitHub README or online examples for event handlers
   - **Risk**: TypeScript errors and incorrect behavior
   - **Solution**: Always use HTML5 event signatures and trust TypeScript definitions

5. **Don't batch state updates in event loops**:
   - **Trap**: Thinking complex async logic will prevent feedback loops
   - **Risk**: More complexity = more bugs, timing issues
   - **Solution**: Use simple ref flags with minimal setTimeout cleanup

### 🚨 CRITICAL AI Transcription Integration Rules

**FULLY WORKING** - Complete frontend-to-backend AI transcription workflow:

1. **Original File Storage Pattern**:

   ```typescript
   interface VideoState {
     file: File | null; // Store original file for backend upload
     url: string | null; // Blob URL for video playback
     fileName: string | null;
     fileMetadata: VideoFileMetadata | null;
   }

   // In setVideoFile:
   file, // Store the original file for backend upload
   ```

2. **AI Transcription Workflow**:

   ```tsx
   const handleAITranscription = async () => {
     // Step 1: Upload video file to backend
     await uploadVideoToBackend(video.file);

     // Step 2: Start transcription (uses uploadedVideoId from step 1)
     await startTranscription();

     // Step 3: Polling happens automatically via useEffect
   };
   ```

3. **Polling Configuration**:
   - **Interval**: 5 seconds
   - **Auto-cleanup**: Polling stops on completion/error
   - **Status tracking**: uploading → processing → completed/error

4. **UI State Management**:
   - Button states: "AI Generate" → "Uploading..." → "Generating..." → "AI Generate"
   - Status messages: Color-coded progress feedback (blue/green/red)
   - Error handling: Graceful degradation with user-friendly messages

### 🚨 CRITICAL AssemblyAI Backend Implementation Rules

**FULLY WORKING** - Real AI transcription with production-ready error handling:

1. **API Endpoints** (all tested and working):
   - `POST /api/videos/upload` - Upload video files (.mp4, .mov, .m4v)
   - `POST /api/captions/transcribe` - Start async AI transcription
   - `GET /api/captions/transcribe/{job_id}` - Poll transcription status
   - `GET /api/health` - System health check

2. **AssemblyAI Configuration** (tested with real API):

   ```python
   config = aai.TranscriptionConfig(
       language_detection=True,  # Auto-detect language
       punctuate=True,           # Add punctuation
       format_text=True          # Clean formatting
   )
   transcript = transcriber.submit(str(video_source), config=config)
   ```

3. **Smart Caption Segmentation**:
   - Groups words into logical segments (max 5 seconds)
   - Breaks at sentence boundaries (., !, ?) when possible
   - Converts AssemblyAI milliseconds to seconds
   - Handles empty transcripts gracefully

4. **Environment Requirements**:
   - **ASSEMBLYAI_API_KEY** environment variable (required)
   - Docker Compose automatically passes from host environment
   - Get API key: https://www.assemblyai.com/dashboard/signup

5. **Error Handling Patterns**:

   ```python
   # Job tracking in memory (production should use Redis/DB)
   transcription_jobs = {}
   video_files = {}

   # Status checking with proper error states
   if transcript.status == aai.TranscriptStatus.error:
       return TranscriptionResponse(status="error", message=transcript.error)
   ```

6. **File Management**:
   - Temporary file storage for uploaded videos
   - Video ID generation for job tracking
   - Cleanup handling (TODO: implement cleanup cron job)

### Key Dependencies

- **Frontend**: Next.js 15.4.6, Tailwind, Shadcn/ui, TypeScript
- **Backend**: FastAPI, AssemblyAI SDK v0.42.1, Pydantic v2
- **Types**: json-schema-to-typescript for automated generation

### Testing Strategy

1. **Frontend**: Test component rendering and user interactions
2. **Backend**: Test API endpoints manually via http://localhost:8000/docs
3. **Types**: Verify TypeScript compilation after schema changes
4. **Integration**: Test full video → AI → caption editing workflow

## Current API Endpoints (Working)

- `GET /api/health` - System health check
- `POST /api/captions/transcribe` - Start AI video transcription
- `GET /api/captions/transcribe/{job_id}` - Check transcription status
