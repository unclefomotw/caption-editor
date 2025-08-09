# Caption Editor

A web application for creating and editing video captions. This tool allows users to load a video, transcribe the audio using AI, and fine-tune the resulting caption segments with a side-by-side editor.

This project is a monorepo powered by [Turborepo](https://turbo.build/), containing a React-based web UI and a Python-based API server.

## Project Structure

- `packages/web-ui`: A [Next.js](https://nextjs.org/) application that provides the front-end user interface.
- `packages/api-server`: A [FastAPI](https://fastapi.tiangolo.com/) application that handles backend tasks like video processing and AI-powered transcription.
- `packages/common-types`: Shared TypeScript types and JSON schemas used across the different packages.

## Getting Started

Follow these instructions to get the project set up and running on your local machine for development and testing.

### Prerequisites

- Node.js (v20.x or later recommended)
- Python (v3.11 or later recommended)
- Poetry for managing Python dependencies.

### 1. Installation

First, clone the repository and install the dependencies.

```bash
# Clone the repository
git clone <repository-url>
cd caption-editor

# Install Node.js dependencies for all workspaces
npm install
```

Next, set up the Python environment for the API server.

```bash
# Navigate to the API server package
cd packages/api-server

# Install Python dependencies using Poetry
poetry install
```

### 2. Running the Development Servers

This project uses [Turborepo](https://turbo.build/) to manage the monorepo. You can start both the front-end and back-end servers with a single command from the project root.

```bash
# From the root of the project
npm run dev
```

This will:
- Start the Next.js development server for the **web-ui** on `http://localhost:3000`.
- Start the FastAPI development server for the **api-server** on `http://localhost:8000`.

You can now open your browser to `http://localhost:3000` to use the application.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

### Attribution

This project is licensed under the MIT License. We're happy for you to use it in your own projects. While not required, we'd appreciate it if you would include a link back to this repository or a mention of the "Caption Editor" project in your application's acknowledgments or about page. Thank you!