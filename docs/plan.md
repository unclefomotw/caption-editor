# Caption Editor Development Plan

This document outlines the action plan, technology stack, and project structure for the Caption Editor web application.

## 1. Action Plan

The development will be phased to prioritize core functionality first.

### Phase 1: Core Editor MVP (Minimum Viable Product)

1.  **Setup Monorepo:** Initialize a monorepo to manage the frontend and backend projects.
2.  **Frontend Scaffolding:** Create a new Next.js application for the web UI.
3.  **Develop Video Player Component:** Implement a React component that can load and play local video files (supporting `.mp4`, `.mov`, and `.m4v`), with controls for play, pause, and seeking.
4.  **Develop Caption Editor Component:** Create the UI for displaying and editing caption segments. This must include the ability to **add**, **delete**, **merge** and **split** segments, in addition to editing text and timestamps.
5.  **Implement Work Persistence:** Use browser `localStorage` to automatically save the user's current work, allowing them to recover from accidental tab closures.
6.  **Client-Side Import/Export:** Implement functionality to import a video file and import/export a standard caption file (e.g., VTT or SRT) directly in the browser. At this stage, no backend is involved.

### Phase 2: Backend Integration & AI Captioning

1.  **Containerize Services:** Create `Dockerfile` configurations for both the `web-ui` and `api-server`.
2.  **Backend API Scaffolding:** Create a Python FastAPI server.
3.  **Develop Caption Generation Module:** Implement a module that connects to a third-party transcription service. For the MVP, this will be **AssemblyAI**. The module will be designed to be pluggable, allowing for other services or local models to be used in the future.
4.  **API Endpoint for Transcription:** Expose the caption generation module via an API endpoint.
5.  **Integrate Frontend with Backend:** Connect the web UI to the backend API to allow users to request AI-generated captions for their video.

### Phase 3: Advanced Features & Pluggability

1.  **Refine Module Architecture:** Solidify the "pluggable" module system for both frontend (import sources) and backend (AI tasks).
2.  **Implement Advanced Video/Caption Import:** Add support for importing captions from generic URLs and videos from Google Drive. The Google Drive integration will use a service account for authentication, allowing access to non-public files.
3.  **Develop Backend Video Downloader:** Create a service in the `api-server` to handle downloading videos from URLs and manage their lifecycle using a temporary file system.
4.  **(Nice-to-have) Implement Timestamp Alignment Module:** Develop the backend module for aligning a transcript.
5.  **(Nice-to-have) Implement Translation Module:** Develop the backend module for caption translation.

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
│   │   └── Dockerfile
│   ├── api-server/         # Python FastAPI backend
│   │   ├── main.py         # FastAPI app entrypoint
│   │   ├── routers/        # API endpoint definitions
│   │   ├── modules/        # Pluggable Python modules
│   │   └── Dockerfile
│   └── common-types/       # Shared data structures (schemas) between front/backend
├── docker-compose.yml      # For local development and orchestration
├── package.json            # Root package.json for managing workspaces
├── pyproject.toml          # Python project configuration (for the backend)
└── ...
```

## 3. Proposed Libraries & Technologies

- **Deployment:**
  - **Docker / Docker Compose**
- **Monorepo Management:**
  - **Turborepo:** To manage dependencies and build processes across the entire monorepo, including both JavaScript/TypeScript and Python packages.
- **Frontend (web-ui):**
  - **Framework:** Next.js (with TypeScript)
  - **UI Components:** **Shadcn/ui** for a modern, clean look, providing full control over component code.
  - **Video Playback:** `react-player`
  - **State Management:** **Zustand** for a lightweight, simple, and performant state management solution, which is well-suited for the high-frequency updates required by the editor's UX.
- **Backend (api-server):**
  - **Framework:** FastAPI
  - **AI - Caption Generation:** **AssemblyAI API** (for the MVP).
  - **Caption File Parsing:** `webvtt-py` or similar libraries for handling `.vtt` and `.srt` files.
  - **Google Drive Integration:** `google-api-python-client` and `google-auth-oauthlib` for service account authentication.
  - **Temporary File Management:** Python's built-in `tempfile` module.
- **Communication:**
  - **External (Frontend-to-Backend):** A REST API will be used for all communication between the `web-ui` and the `api-server`.
  - **Internal (Backend Modules):** The `api-server` will invoke its internal Python modules (e.g., different AI transcribers) directly as standard Python function calls. This is an internal implementation detail and does not involve a separate communication protocol.

## 4. Core UX Interaction Model: Player & Editor

The interaction between the video player and the caption editor is designed to be seamless and intuitive, based on a principle of **bidirectional synchronization**.

- **During Playback:**
  - **Active Segment Highlighting:** The caption segment corresponding to the video's current timestamp will be visually highlighted.
  - **Auto-Scrolling:** The caption editor will automatically scroll to keep the highlighted segment in view.

- **User Interaction with Editor:**
  - **Clicking a Segment:** Clicking on any part of a caption segment (text or timestamp) will cause the video player to immediately seek to that segment's start time.
  - **Editing Text:** When a user focuses on a caption text input field, the video will automatically pause to allow for easier editing.

- **User Interaction with Player:**
  - **Seeking/Scrubbing:** When the user seeks to a new position using the video player's timeline, the caption editor will instantly scroll to and highlight the corresponding caption segment.

### A Possible Implementation Design

Here is a possible design for implementing the interaction model.

#### Core Design Philosophy

The video player and the caption editor are two views of the same timeline. They must always be synchronized. The interaction is **bidirectional**:

- Changes in the player's state (playing, pausing, seeking) will update the editor's view.
- Actions in the editor (clicking a segment, editing text) will control the player's state.

#### Visual Layout

- **Video Player:** Positioned on one side of the screen (e.g., left). It will have standard controls: a play/pause button, a volume control, and a timeline/scrubber that shows the current playback position.
- **Caption Editor:** Positioned on the other side (e.g., right). It will display a scrollable list of caption segments. Each segment in the list will be a distinct UI element containing:
  - A start timestamp input (e.g., `00:01:23.456`).
  - An end timestamp input.
  - A multi-line text area for the caption content.

#### Interaction Scenarios

- **When the video is playing:**
  - **Active Segment Highlighting:** As the video plays, the `currentTime` of the player is constantly monitored. The caption segment whose time range (`startTime` <= `currentTime` < `endTime`) matches the video's current time will be visually highlighted.
  - **Auto-Scrolling:** The list of caption segments will automatically scroll to keep the currently active (highlighted) segment visible.
- **When the user interacts with the caption editor:**
  - **Clicking on a Segment:** If the user clicks anywhere on a specific caption segment, the video player will immediately **seek** to the `startTime` of that segment.
  - **Focusing on a Text Area to Type:** When a user clicks into a caption segment's text area to begin typing, the video will **automatically pause**.
- **When the user seeks the video to a new timestamp:**
  - **Scrubbing the Timeline:** If the user clicks or drags the scrubber on the video player's timeline to a new position, the caption editor will instantly update to highlight and scroll to the caption segment corresponding to the new timestamp.

#### Underlying Data Flow (State Management)

A central state management system (like Zustand or Redux Toolkit) will orchestrate this:

1.  **Source of Truth:** The application state will hold the list of `captionSegments` and the `videoCurrentTime`.
2.  **Player to Editor:** The video player's `onTimeUpdate` event will continuously update the `videoCurrentTime` in the central state. The caption editor listens for changes to this value and re-renders to highlight the correct segment.
3.  **Editor to Player:** When a user clicks a caption segment, an action is dispatched to update the `videoCurrentTime` in the state. The video player component listens for this change and programmatically calls the `seek()` method on the video element.

#### Conceptual Code Example

This simplified pseudo-code example demonstrates how `react-player` could be used:

```jsx
import React, { useState, useRef } from "react";
import ReactPlayer from "react-player";
import CaptionEditor from "./CaptionEditor";

function VideoEditor() {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [captions, setCaptions] = useState([
    /* ... */
  ]);

  const handleProgress = (state) => {
    setCurrentTime(state.playedSeconds);
  };

  const handleCaptionSegmentClick = (startTime) => {
    if (playerRef.current) {
      playerRef.current.seekTo(startTime, "seconds");
      setIsPlaying(true);
    }
  };

  const handleCaptionFocus = () => {
    setIsPlaying(false);
  };

  return (
    <div>
      <ReactPlayer
        ref={playerRef}
        url="path/to/video.mp4"
        playing={isPlaying}
        onProgress={handleProgress}
        controls={true}
      />
      <CaptionEditor
        captions={captions}
        currentTime={currentTime}
        onSegmentClick={handleCaptionSegmentClick}
        onTextFocus={handleCaptionFocus}
      />
    </div>
  );
}
```

## 5. Pluggable Module Design Principles

To ensure the application remains extensible and maintainable, future developers should adhere to the following principles when adding new modules (e.g., AI services, import sources).

### Backend (AI & Processing Modules)

1.  **Define a Strict Contract:** All modules of a similar type (e.g., all transcribers) must implement a shared interface, such as a Python Abstract Base Class (ABC). This contract defines the required methods and their signatures.
2.  **Standardize Data Structures:** Modules must accept and return data in a consistent, standardized format that is defined and used by the core application. Do not pass module-specific data structures back to the main application.
3.  **Isolate Implementations:** The core application logic should never directly import or reference a specific, concrete module implementation (e.g., `AssemblyAITranscriber`).
4.  **Use a Factory for Instantiation:** Access to modules should be managed through a factory function or a similar mechanism. This factory will be responsible for selecting and instantiating the correct module based on the application's configuration.

### Frontend (Import & UI Modules)

1.  **Define a Contract via Props:** A component's pluggability is defined by its props. All interchangeable components must accept a common set of props, especially callback functions (e.g., `onVideoReady`) that communicate with the parent component.
2.  **Keep Modules Self-Contained:** The internal logic of a pluggable component should be entirely self-contained. The parent component should not need to know about the module's internal state or implementation details.
3.  **Use Conditional Rendering to Swap Modules:** The parent application should use a state variable and conditional rendering to display the currently selected module. It will pass the same set of callback props to whichever module is active, ensuring a stable integration point.

## 6. Data & Type Synchronization Strategy

To ensure type safety and prevent integration errors between the `web-ui` (TypeScript) and the `api-server` (Python), a shared data schema is critical.

1.  **Single Source of Truth:** The `packages/common-types` directory will contain a set of **JSON Schema** files (`.json`). These schemas will be the single source of truth for all shared data structures (e.g., the structure of a caption segment, API request bodies, and API responses).
2.  **Code Generation:**
    - **Backend (Python):** Pydantic models will be automatically generated from these JSON Schemas. This ensures that the FastAPI backend validates all incoming and outgoing data against the official contract.
    - **Frontend (TypeScript):** TypeScript interfaces will be automatically generated from the same JSON Schemas. This provides compile-time type checking and IntelliSense for all API interactions in the Next.js application.
3.  **Workflow:** A script will be added to the root `package.json` to run the code generation process. This script should be run whenever a schema is changed to ensure the generated types are always up-to-date.

## 7. Configuration Management

A distinction is made between system-level configuration (which is set at deployment time) and session-level user choices (which are made in the UI).

### System-Level Configuration (e.g., AI Modules)

For backend modules that are selected at deployment time, such as the AI transcription service, a hybrid configuration model will be used.

1.  **Primary Source:** A `config.yaml` file will define the structure of the configuration, including available modules and their parameters. An example file (`config.example.yaml`) will be committed to the repository.
2.  **Environment Variable Overrides:** The application will allow any value in the `config.yaml` to be overridden by an environment variable. This is the preferred method for injecting secrets (like API keys) and for configuring the application in containerized cloud environments.

### Session-Level Choices (e.g., Import Sources)

For features that represent a user's choice within a session, such as importing a video from a local file versus a Google Drive URL, this is not a configuration issue. These are distinct user workflows that will be presented as choices in the UI. The frontend will have separate components for each import method, and the backend will have distinct API endpoints to handle the different sources.

## 8. System Constraints

To ensure stability and a consistent user experience, the following constraints will be applied for the initial version of the application.

- **Video File Formats:**
  - **Must Support:** `.mp4`
  - **Best Effort:** `.mov`, `.m4v`
  - **Out of Scope for MVP:** `.avi`, HLS/DASH streaming (`.m3u8`)
