# Backend Dockerfile for FastAPI application
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    POETRY_VERSION=2.1.1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry==$POETRY_VERSION

# Set working directory
WORKDIR /app

# Copy poetry files
COPY pyproject.toml poetry.lock ./

# Configure poetry to not create virtual environment (we're in a container)
RUN poetry config virtualenvs.create false

# Install dependencies only (without the project itself)
RUN poetry install --only main --no-root

# Copy source code
COPY . .

# Install the project itself
RUN poetry install --only-root

# Expose port
EXPOSE 8000

# Development command (with auto-reload)
CMD ["poetry", "run", "uvicorn", "caption_editor_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]