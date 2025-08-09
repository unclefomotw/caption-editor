# Caption Editor

A web application for creating and editing video captions. This tool allows users to load a video, transcribe the audio using AI, and fine-tune the resulting caption segments with a side-by-side editor.

This project is a monorepo powered by [Turborepo](https://turbo.build/), containing a React-based web UI and a Python-based API server.

## Project Structure

- `packages/web-ui`: A [Next.js](https://nextjs.org/) application that provides the front-end user interface.
- `packages/api-server`: A [FastAPI](https://fastapi.tiangolo.com/) application that handles backend tasks like video processing and AI-powered transcription.
- `packages/common-types`: Shared TypeScript types and JSON schemas used across the different packages.

## Getting Started

Follow these instructions to get the project set up for development.

### 1. Prerequisites

- **Node.js**: v20.x or later recommended.
- **Python**: v3.11 or later recommended.
- **Poetry**: For managing Python dependencies.
- **Docker**: Required for the Docker Compose development method.
- **AssemblyAI API Key**: Required for video transcription. Get a free key [here](https://www.assemblyai.com/dashboard/signup).

### 2. Initial Setup

First, clone the repository and install the Node.js dependencies.

```bash
git clone <repository-url>
cd caption-editor
npm install
```

Next, set your AssemblyAI API key as an environment variable. This is required for the application to function.

```bash
# Export your API key in your shell
export ASSEMBLYAI_API_KEY="your-actual-api-key-here"

# Verify it's set
echo $ASSEMBLYAI_API_KEY
```

### 3. Running the Application (Development)

You have two primary options for running the development environment. Choose the one that best fits your workflow.

#### Option 1: Docker Compose (Recommended for Full Stack)

This method starts both the frontend and backend services in a consistent, containerized environment.

- **Pros**: Consistent environment, both services start together, production-like setup.
- **Cons**: Slightly slower hot-reloading.

```bash
# Start both frontend and backend services
npm run docker:dev
```
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8000`

#### Option 2: Native Development (for Individual Services)

This method provides the fastest iteration speed and is ideal when focusing on a single service. You will need to set up the Python environment manually.

- **Pros**: Fastest hot-reloading, direct debugging access.
- **Cons**: Requires managing separate terminal processes.

**Setup Python Environment (One-time only):**
```bash
# Navigate to the API server package
cd packages/api-server

# Install Python dependencies using Poetry
poetry install
```

**Run Services (in separate terminals):**
```bash
# --- Terminal 1: Start Frontend ---
# From the project root
cd packages/web-ui
npm run dev
# Frontend available at http://localhost:3000
```

```bash
# --- Terminal 2: Start Backend ---
# From the project root
cd packages/api-server
poetry run uvicorn caption_editor_api.main:app --reload
# Backend available at http://localhost:8000
```

## Other Common Commands

All commands should be run from the project root.

- **Build all packages**:
  ```bash
  npm run build
  ```

- **Lint all packages**:
  ```bash
  npm run lint
  ```

- **Format all code**:
  ```bash
  npm run format
  ```

- **Regenerate shared TypeScript types**:
  ```bash
  npm run generate-types
  ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

### Attribution

This project is licensed under the MIT License. We're happy for you to use it in your own projects. While not required, we'd appreciate it if you would include a link back to this repository or a mention of the "Caption Editor" project in your application's acknowledgments or about page. Thank you!
