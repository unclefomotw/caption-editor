"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import health, captions

app = FastAPI(
    title="Caption Editor API",
    description="API server for video caption editing application",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(captions.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Caption Editor API Server"}
