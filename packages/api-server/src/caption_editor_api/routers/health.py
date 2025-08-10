"""Health check router."""

from fastapi import APIRouter
from pydantic import BaseModel

from .. import __version__

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str
    message: str
    version: str = __version__


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="healthy", message="Caption Editor API is running")
