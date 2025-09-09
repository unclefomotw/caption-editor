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

### Key Dependencies

- **Frontend**: Next.js 15.4.6, Tailwind, Shadcn/ui, TypeScript
- **Backend**: FastAPI, AssemblyAI SDK v0.42.1, Pydantic v2
- **Types**: json-schema-to-typescript for automated generation

### Testing Strategy

1. **Frontend**: Test component rendering and user interactions
2. **Backend**: Test API endpoints manually via http://localhost:8000/docs
3. **Types**: Verify TypeScript compilation after schema changes
4. **Integration**: Test full video → AI → caption editing workflow
