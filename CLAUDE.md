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
- **AssemblyAI** for AI transcription (dependency added, not implemented)

### Shared Types (packages/common-types)
- **JSON Schema** for data structure definitions
- **TypeScript generation** from JSON schemas
- **Workspace linking** for type sharing across packages

### Monorepo Setup
- **Turborepo** for build orchestration
- **npm workspaces** for JavaScript packages
- **Poetry** for Python package management

## Key Technical Solution about Video Playback
ReactPlayer v3.3.1 uses HTML5 video events, not ReactPlayer-specific callbacks. See `docs/reactplayer-reality-guide.md` for complete details.

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
11. **🎉 Bidirectional video/caption synchronization** - COMPLETE AND TESTED
    - Real-time caption highlighting during video playback
    - Click-to-seek: clicking captions jumps video to timestamp
    - Smooth auto-scrolling in caption editor following video progress
    - Live caption text editing with immediate preview
    - Auto-generated sample captions for new videos

### ❌ Not Started
- localStorage persistence for work recovery
- Caption file import/export (VTT/SRT parsing)
- AI transcription integration (AssemblyAI)
- Docker configurations
- API endpoint connections
- End-to-end workflow testing

## How to Run/Test

### Full Development Server
```bash
# From project root
npm run dev
```
Starts Next.js frontend on http://localhost:3000

### Individual Packages
```bash
# Frontend only
cd packages/web-ui
npm run dev

# Backend server
cd packages/api-server
source .venv/bin/activate  # or: poetry shell
uvicorn caption_editor_api.main:app --reload
# Backend runs on http://localhost:8000
# API docs available at http://localhost:8000/docs
```

### Build Commands
```bash
npm run build        # Build all packages (includes type generation)
npm run lint         # Lint all packages
npm run generate-types  # Generate TypeScript types from JSON schemas
```

### Type Generation System
```bash
# Regenerate types after schema changes
cd packages/common-types
npm run generate-types

# Or build everything (includes type generation)
cd ../..
npm run build
```

## Project Structure

```
caption-editor/
├── package.json          # Workspace root
├── turbo.json           # Turborepo config
├── pyproject.toml       # Python workspace root
├── CLAUDE.md           # This file
└── packages/
    ├── web-ui/         # Next.js frontend (COMPLETE)
    │   ├── src/app/
    │   ├── components.json
    │   └── package.json
    ├── api-server/     # FastAPI backend (COMPLETE)
    │   ├── src/caption_editor_api/
    │   │   ├── main.py           # FastAPI app
    │   │   └── routers/          # API endpoints
    │   │       ├── health.py     # Health check
    │   │       └── captions.py   # Caption processing
    │   ├── pyproject.toml        # Poetry config
    │   ├── poetry.lock          # Locked dependencies
    │   └── .venv/               # Virtual environment
    └── common-types/   # Shared schemas (COMPLETE)
        ├── schemas/            # JSON schema definitions
        │   ├── caption-segment.json
        │   ├── caption-file.json
        │   └── api-contracts.json
        ├── src/types/         # Generated TypeScript
        │   ├── caption-segment.ts
        │   ├── caption-file.ts
        │   ├── api-contracts.ts
        │   └── index.ts       # Exports all types
        ├── scripts/           # Type generation
        │   └── generate-types.js
        └── package.json
```

## Rules for Successors

### Development Workflow
1. **Always run commands from project root** when using Turborepo
2. **Use workspace commands**: `npm run dev` instead of individual package commands
3. **Test both frontend and backend** after making changes
4. **Generate types after schema changes**: Run `npm run build` to regenerate TypeScript types

### Code Standards
1. **Follow existing file structure** - don't create new top-level directories
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
     src={videoUrl}      // ✅ CORRECT - use 'src'
     url={videoUrl}      // ❌ WRONG - will cause TypeScript errors
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

### 🚨 CRITICAL Bidirectional Synchronization Implementation Rules
**MUST READ**: Key patterns for maintaining video/caption sync that have been tested and verified:

1. **Auto-generate sample captions on video load**:
   ```tsx
   // In handleDurationChange after setVideoReady(true)
   if (!captionFile) {
     const sampleCaptionFile = {
       // Generate sample segments within video duration
     };
     setCaptionFile(sampleCaptionFile);
   }
   ```

2. **Use HTML5 video element for direct seeking**:
   ```tsx
   // When clicking caption segments
   const videoElement = document.querySelector('video');
   if (videoElement) {
     videoElement.currentTime = segment.startTime;
   }
   ```

3. **Implement smooth auto-scrolling with refs**:
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

4. **Enhanced visual feedback for active segments**:
   ```tsx
   className={`${
     isSelected 
       ? 'bg-blue-100 border-l-4 border-blue-500 shadow-sm transform translate-x-1' 
       : 'hover:bg-gray-50 hover:translate-x-0.5'
   }`}
   ```

### FastAPI Backend Structure
The backend is complete with working endpoints:
- **Health**: `GET /api/health`
- **Upload**: `POST /api/captions/upload` (VTT/SRT files)
- **Transcribe**: `POST /api/captions/transcribe` (AI transcription)
- **Status**: `GET /api/captions/transcribe/{job_id}` (Check transcription)

### Key Dependencies Already Added
- **Frontend**: Next.js 15.4.6, Tailwind, Shadcn/ui, TypeScript
- **Backend**: FastAPI, Uvicorn, Pydantic, AssemblyAI, HTTPX
- **Types**: json-schema-to-typescript for automated generation

### Testing Strategy
1. **Frontend**: Test component rendering and user interactions
2. **Backend**: Test API endpoints manually via http://localhost:8000/docs
3. **Types**: Verify TypeScript compilation after schema changes
4. **Integration**: Test full video → AI → caption editing workflow

## Current API Endpoints (Working)
- `GET /api/health` - System health check
- `POST /api/captions/upload` - Upload VTT/SRT caption files
- `POST /api/captions/transcribe` - Start AI video transcription
- `GET /api/captions/transcribe/{job_id}` - Check transcription status

## Next Priority Tasks (In Order)

### 🎯 IMMEDIATE NEXT STEPS
1. **Add localStorage persistence** - Auto-save user work
   - Save video URL and caption data locally
   - Restore work session on page reload
   - Handle blob URL persistence challenges

2. **Caption file import/export (VTT/SRT)**
   - Parse VTT/SRT files into caption segments
   - Generate VTT/SRT files from current caption data
   - File validation and error handling

3. **Connect to FastAPI backend** - Real API integration
   - Upload video files to backend for processing
   - Connect frontend caption editor to backend endpoints
   - Handle async operations with proper loading states

### 🤖 AI INTEGRATION
4. **Implement AssemblyAI transcription** - AI-powered caption generation
   - Upload video to backend for AI transcription
   - Stream transcription results back to frontend
   - Allow editing of AI-generated captions

### 🚀 ADVANCED FEATURES
5. **Advanced video controls** - Volume, playback speed, fullscreen
6. **Caption styling and formatting** - Font size, colors, positioning
7. **Multi-language support** - Caption translation features
8. **Docker deployment** - Containerization for production

### 🧪 TESTING & POLISH
9. **End-to-end workflow testing** - Complete user journey validation
10. **Performance optimization** - Large video file handling
11. **Error handling & UX polish** - Comprehensive error states and user feedback

**Note for successors**: The core caption editing workflow is now FULLY FUNCTIONAL with complete bidirectional synchronization. The next critical features are persistence, file I/O, and backend integration.
