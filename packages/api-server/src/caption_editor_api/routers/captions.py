"""Caption processing router."""

import os
import tempfile
from typing import List, Optional

import assemblyai as aai
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

# Configure AssemblyAI - in production this should be from environment variables
# For now using a placeholder - user will need to set their API key
aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY", "your-assemblyai-api-key-here")

router = APIRouter()

# Store for tracking transcription jobs (in production, use Redis or database)
transcription_jobs = {}
# Store for mapping video IDs to file paths
video_files = {}


class CaptionSegment(BaseModel):
    """Caption segment model."""

    id: str
    start_time: float
    end_time: float
    text: str


class CaptionFile(BaseModel):
    """Caption file model."""

    segments: List[CaptionSegment]
    language: Optional[str] = "en"
    format: Optional[str] = "vtt"


class TranscriptionRequest(BaseModel):
    """Request model for AI transcription."""

    video_id: Optional[str] = None
    video_url: Optional[str] = None
    language: Optional[str] = "en"


class TranscriptionResponse(BaseModel):
    """Response model for AI transcription."""

    status: str
    job_id: Optional[str] = None
    captions: Optional[CaptionFile] = None
    message: str


class VideoUploadResponse(BaseModel):
    """Response model for video upload."""

    video_id: str
    filename: str
    size: int
    duration: Optional[float] = None
    message: str


@router.post("/videos/upload", response_model=VideoUploadResponse)
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file for processing."""
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Check supported video formats
    supported_extensions = ['.mp4', '.mov', '.m4v']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in supported_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format. Supported formats: {', '.join(supported_extensions)}"
        )

    # Create temporary file to store the video
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
        # Read and write file content
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    # Generate video ID (using filename + temp path for uniqueness)
    video_id = f"video_{os.path.basename(temp_file_path)}"

    # Store the file path mapping for transcription
    video_files[video_id] = temp_file_path

    # TODO: Extract video metadata (duration, etc.) using ffprobe or similar
    # For now, return basic file info
    return VideoUploadResponse(
        video_id=video_id,
        filename=file.filename,
        size=len(content),
        message=f"Video '{file.filename}' uploaded successfully. Ready for transcription."
    )


@router.post("/captions/upload", response_model=CaptionFile)
async def upload_caption_file(file: UploadFile = File(...)):
    """Upload and parse a caption file (VTT/SRT)."""
    if not file.filename or not file.filename.endswith(('.vtt', '.srt')):
        raise HTTPException(
            status_code=400,
            detail="Only VTT and SRT files are supported"
        )

    # TODO: Implement actual file parsing
    # This is a placeholder response
    return CaptionFile(
        segments=[
            CaptionSegment(
                id="1",
                start_time=0.0,
                end_time=3.0,
                text="Sample caption segment"
            )
        ]
    )


@router.post("/captions/transcribe", response_model=TranscriptionResponse)
async def transcribe_video(request: TranscriptionRequest):
    """Start AI transcription of a video."""
    if not request.video_id and not request.video_url:
        raise HTTPException(
            status_code=400,
            detail="Either video_id (for uploaded video) or video_url is required"
        )

    try:
        transcriber = aai.Transcriber()

        # Determine the source for transcription
        if request.video_id:
            # Use uploaded video file
            if request.video_id not in video_files:
                raise HTTPException(
                    status_code=404,
                    detail=f"Video ID '{request.video_id}' not found"
                )
            video_source = video_files[request.video_id]
        else:
            # Use video URL directly
            video_source = request.video_url

        # Configure transcription with word-level timestamps
        config = aai.TranscriptionConfig(
            language_detection=True,
            punctuate=True,
            format_text=True
        )

        # Submit transcription job to AssemblyAI
        # Note: This is non-blocking, returns immediately with a job
        transcript = transcriber.submit(str(video_source), config=config)

        # Store job information for status checking
        job_id = transcript.id
        transcription_jobs[job_id] = {
            "transcript": transcript,
            "status": "processing",
            "video_source": request.video_id or request.video_url,
            "language": request.language or "en"
        }

        return TranscriptionResponse(
            status="processing",
            job_id=job_id,
            message="Transcription started successfully with AssemblyAI"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start transcription: {str(e)}"
        )


@router.get("/captions/transcribe/{job_id}", response_model=TranscriptionResponse)
async def get_transcription_result(job_id: str):
    """Get transcription result by job ID."""
    if job_id not in transcription_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Transcription job '{job_id}' not found"
        )

    job_info = transcription_jobs[job_id]
    transcript = job_info["transcript"]

    try:
        # Check the current status from AssemblyAI
        # This will not wait - just check current status
        current_transcript = aai.Transcript.get_by_id(transcript.id)

        if current_transcript.status == aai.TranscriptStatus.completed:
            # Convert AssemblyAI words to our CaptionSegment format
            segments = []

            if current_transcript.words:
                # Group words into segments (sentences or by time intervals)
                current_segment_words = []
                segment_start_time = None
                segment_id = 1

                for word in current_transcript.words:
                    if segment_start_time is None:
                        segment_start_time = word.start / 1000.0  # Convert ms to seconds

                    current_segment_words.append(word.text)

                    # End segment on punctuation or after ~5 seconds
                    is_end_of_sentence = word.text.endswith(('.', '!', '?'))
                    segment_duration = (word.end / 1000.0) - segment_start_time
                    should_end_segment = is_end_of_sentence or segment_duration >= 5.0

                    if should_end_segment or word == current_transcript.words[-1]:
                        # Create segment
                        segment = CaptionSegment(
                            id=str(segment_id),
                            start_time=segment_start_time,
                            end_time=word.end / 1000.0,  # Convert ms to seconds
                            text=" ".join(current_segment_words)
                        )
                        segments.append(segment)

                        # Reset for next segment
                        segment_id += 1
                        current_segment_words = []
                        segment_start_time = None

            # Update job status
            transcription_jobs[job_id]["status"] = "completed"

            return TranscriptionResponse(
                status="completed",
                job_id=job_id,
                captions=CaptionFile(segments=segments),
                message="Transcription completed successfully"
            )

        elif current_transcript.status == aai.TranscriptStatus.error:
            # Update job status
            transcription_jobs[job_id]["status"] = "error"

            return TranscriptionResponse(
                status="error",
                job_id=job_id,
                message=f"Transcription failed: {current_transcript.error}"
            )

        else:
            # Still processing
            return TranscriptionResponse(
                status="processing",
                job_id=job_id,
                message="Transcription is still in progress"
            )

    except Exception as e:
        return TranscriptionResponse(
            status="error",
            job_id=job_id,
            message=f"Error checking transcription status: {str(e)}"
        )