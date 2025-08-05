# Caption Editor Development Plan

This document outlines the action plan, technology stack, and project structure for the Caption Editor web application.

## 1. Action Plan

The development will be phased to prioritize core functionality first.

### Phase 1: Core Editor MVP (Minimum Viable Product)
1.  **Setup Monorepo:** Initialize a monorepo to manage the frontend and backend projects.
2.  **Frontend Scaffolding:** Create a new Next.js application for the web UI.
3.  **Develop Video Player Component:** Implement a React component that can load and play a local video file, with controls for play, pause, and seeking.
4.  **Develop Caption Editor Component:** Create the UI for displaying and editing caption segments (timestamps and text).
5.  **Client-Side Import/Export:** Implement basic functionality to import a video file and import/export a standard caption file (e.g., VTT or SRT) directly in the browser. At this stage, no backend is involved.

### Phase 2: Backend Integration & AI Captioning
1.  **Backend API Scaffolding:** Create a Python FastAPI server.
2.  **Develop Caption Generation Module:** Implement the first AI-powered transcription module (e.g., using OpenAI's Whisper).
3.  **API Endpoint for Transcription:** Expose the caption generation module via an API endpoint.
4.  **Integrate Frontend with Backend:** Connect the web UI to the backend API to allow users to request AI-generated captions for their video.

### Phase 3: Advanced Features & Pluggability
1.  **Refine Module Architecture:** Solidify the "pluggable" module system for both frontend (import sources) and backend (AI tasks).
2.  **Implement Advanced Caption Import:** Add support for importing captions from URLs.
3.  **(Nice-to-have) Implement Timestamp Alignment Module:** Develop the backend module for aligning a transcript.
4.  **(Nice-to-have) Implement Translation Module:** Develop the backend module for caption translation.

## 2. Proposed Directory Structure

A monorepo structure will be used to separate the frontend and backend concerns.

```
/
├── docs/
│   ├── prd-draft.md
│   └── plan.md
├── packages/
│   ├── web-ui/             # Next.js (TypeScript) frontend
│   │   ├── components/     # React components (e.g., VideoPlayer, CaptionEditor)
│   │   ├── app/            # Next.js app router
│   │   └── ...
│   ├── api-server/         # Python FastAPI backend
│   │   ├── main.py         # FastAPI app entrypoint
│   │   ├── routers/        # API endpoint definitions
│   │   └── modules/        # Pluggable Python modules
│   └── common-types/       # (Optional) Shared data structures between front/backend
├── package.json            # Root package.json for managing workspaces
├── pyproject.toml          # Python project configuration (for the backend)
└── ...
```

## 3. Proposed Libraries & Technologies

*   **Monorepo Management:**
    *   **Turborepo** or **Nx:** To manage dependencies and build processes for the JavaScript/TypeScript workspace.
*   **Frontend (web-ui):**
    *   **Framework:** Next.js (with TypeScript)
    *   **UI Components:** Shadcn/ui or Material-UI (MUI) for a modern, clean look.
    *   **Video Playback:** `react-player`
    *   **State Management:** Zustand or Redux Toolkit
*   **Backend (api-server):**
    *   **Framework:** FastAPI
    *   **AI - Caption Generation:** `openai-whisper` (This is a strong, open-source starting point that can run locally/on-premise).
    *   **Caption File Parsing:** `webvtt-py` or similar libraries for handling `.vtt` and `.srt` files.
*   **Communication:**
    *   REST API for communication between `web-ui` and `api-server`.
