# Development Guide

This project supports both **Turborepo** and **Docker Compose** development approaches.

## Prerequisites

**AssemblyAI API Key**: Required for video transcription functionality.
```bash
# Export your API key in your shell
export ASSEMBLYAI_API_KEY="your-actual-api-key-here"

# Verify it's set
echo $ASSEMBLYAI_API_KEY
```

Get your API key from: https://www.assemblyai.com/dashboard/signup

## Quick Start Options

### Option 1: Docker Compose (Full Stack)
```bash
# Start both frontend and backend
npm run docker:dev

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

- ✅ **Consistent environment** across team members
- ✅ **Both services start together** 
- ✅ **Production-like setup**
- ❌ Slightly slower hot reload
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend: http://localhost:8000

### Option 2: Native Development (Individual Services)
```bash
# Frontend only (fastest hot reload)
cd packages/web-ui
npm run dev

# Backend only (in another terminal)
cd packages/api-server
/Users/uu/.local/bin/poetry run uvicorn caption_editor_api.main:app --reload
```

- ✅ **Fastest iteration** and hot reload
- ✅ **Direct debugging** access
- ❌ Need to start services individually
- ❌ Environment differences possible

### Option 3: Turborepo (Mixed)
```bash
# Starts frontend only (backend needs manual start)
npm run dev
```

- ✅ Good for **frontend-focused work**
- ❌ Backend requires separate terminal
- 🌐 Frontend: http://localhost:3001 (if 3000 is taken)

## Recommended Workflows

### 🎯 Full Stack Development
**Use Docker Compose** when:
- Working on frontend ↔ backend integration
- Adding new services (database, cache, etc.)
- Onboarding new team members
- Testing production-like scenarios

### ⚡ Frontend Development
**Use Native** when:
- Focused on UI/UX work
- Need fastest possible hot reload
- Debugging frontend issues

### 🔧 Backend Development  
**Use Native** when:
- Working on API logic
- Debugging Python code
- Testing with external services

## Type Generation

```bash
# Regenerate shared types (works with both approaches)
npm run generate-types
```

## Build and Deployment

```bash
# Build all packages
npm run build

# Lint all packages  
npm run lint
```