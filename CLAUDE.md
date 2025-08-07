# Caption Editor - Claude Development Notes

## Project Overview
Building a web application for editing video captions with AI-powered transcription capabilities.

## Tech Stack Implemented

### Frontend (packages/web-ui)
- **Next.js 15.4.6** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** components library
- **App Router** with src directory structure

### Backend (packages/api-server) - IN PROGRESS
- **FastAPI** with Python 3.11+
- **Poetry** for dependency management. Use Poetry 2.1
- **Pydantic** for data validation
- **AssemblyAI** for AI transcription (planned)

### Monorepo Setup
- **Turborepo** for build orchestration
- **npm workspaces** for JavaScript packages
- **Poetry** for Python package management

## Current Status

### ✅ Completed
1. Monorepo structure with proper workspace configuration
2. Next.js frontend with Shadcn/ui setup
3. Basic FastAPI project structure with pyproject.toml
4. Root workspace dependencies installed

### ⚠️ In Progress
- FastAPI backend (missing router files to be runnable)

### ❌ Not Started
- JSON schemas in common-types package
- Docker configurations
- AI transcription integration
- Frontend components (VideoPlayer, CaptionEditor)

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

# Backend (when complete)
cd packages/api-server
poetry install
poetry run uvicorn caption_editor_api.main:app --reload
```

### Build Commands
```bash
npm run build  # Build all packages
npm run lint   # Lint all packages
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
    ├── api-server/     # FastAPI backend (IN PROGRESS)
    │   ├── src/caption_editor_api/
    │   └── pyproject.toml
    └── common-types/   # Shared schemas (EMPTY)
```

## Rules for Successors

### Development Workflow
1. **Always run commands from project root** when using Turborepo
2. **Use workspace commands**: `npm run dev` instead of individual package commands
3. **Test both frontend and backend** after making changes

### Code Standards
1. **Follow existing file structure** - don't create new top-level directories
2. **Use TypeScript** for all frontend code
3. **Use Poetry** for Python dependency management
4. **Keep monorepo workspace clean** - dependencies belong in individual packages

### FastAPI Backend Continuation
The backend needs these files to be runnable:
```
src/caption_editor_api/routers/
├── __init__.py
├── health.py      # Health check endpoint
└── captions.py    # Caption processing endpoints
```

### Key Dependencies to Remember
- **Frontend**: react-player (for video playback), zustand (state management)
- **Backend**: assemblyai (AI transcription), python-multipart (file uploads)
- **Shared**: JSON schemas for type safety between frontend/backend

### Testing Strategy
1. **Frontend**: Test component rendering and user interactions
2. **Backend**: Test API endpoints with pytest
3. **Integration**: Test full video → AI → caption editing workflow

## Known Issues
- Backend router files incomplete (main.py references missing files)
- No shared type definitions between frontend/backend yet
- Docker configurations not implemented

## Next Priority Tasks
1. Complete FastAPI router files to make backend runnable
2. Implement JSON schemas in common-types package
3. Add VideoPlayer component with react-player
4. Implement caption editing UI components