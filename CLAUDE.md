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

## Current Status

### ✅ Completed (6/20 tasks - 30%)
1. **Monorepo structure** with proper workspace configuration
2. **Next.js frontend** with Shadcn/ui setup - fully functional
3. **FastAPI backend** with complete router structure and dependencies
4. **Turborepo** build orchestration with proper pipeline
5. **JSON schemas** and TypeScript type generation system
6. **Type generation** scripts with automated build integration

### ❌ Not Started
- Frontend components (VideoPlayer, CaptionEditor)
- Zustand state management
- Video file handling and playback
- AI transcription integration (AssemblyAI)
- Docker configurations
- Caption file import/export (VTT/SRT parsing)

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
1. **Add react-player** to web-ui and implement VideoPlayer component
2. **Add zustand** for state management of caption segments
3. **Implement CaptionEditor** component with segment editing UI
4. **Connect frontend to backend** API endpoints
5. **Implement real AssemblyAI** integration (currently mock responses)