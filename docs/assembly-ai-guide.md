## Testing AssemblyAI Backend Integration

```bash
# 1. Test video upload
curl -X POST "http://localhost:8000/api/videos/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/video.mp4"

# 2. Start transcription (use video_id from upload response)
curl -X POST "http://localhost:8000/api/captions/transcribe" \
  -H "Content-Type: application/json" \
  -d '{"video_id": "VIDEO_ID_FROM_UPLOAD"}'

# 3. Check transcription status (use job_id from transcribe response)
curl "http://localhost:8000/api/captions/transcribe/JOB_ID_FROM_START"
```
