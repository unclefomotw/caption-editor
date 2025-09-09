## 🚨 CRITICAL AI Transcription Integration Rules

**FULLY WORKING** - Complete frontend-to-backend AI transcription workflow:

1. **Original File Storage Pattern**:

   ```typescript
   interface VideoState {
     file: File | null; // Store original file for backend upload
     url: string | null; // Blob URL for video playback
     fileName: string | null;
     fileMetadata: VideoFileMetadata | null;
   }

   // In setVideoFile:
   file, // Store the original file for backend upload
   ```

2. **AI Transcription Workflow**:

   ```tsx
   const handleAITranscription = async () => {
     // Step 1: Upload video file to backend
     await uploadVideoToBackend(video.file);

     // Step 2: Start transcription (uses uploadedVideoId from step 1)
     await startTranscription();

     // Step 3: Polling happens automatically via useEffect
   };
   ```

3. **Polling Configuration**:
   - **Interval**: 5 seconds
   - **Auto-cleanup**: Polling stops on completion/error
   - **Status tracking**: uploading → processing → completed/error

4. **UI State Management**:
   - Button states: "AI Generate" → "Uploading..." → "Generating..." → "AI Generate"
   - Status messages: Color-coded progress feedback (blue/green/red)
   - Error handling: Graceful degradation with user-friendly messages
