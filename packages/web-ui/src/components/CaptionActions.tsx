'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCaptionStore } from '@/stores/caption-store';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, Sparkles, Loader2 } from 'lucide-react';
import {
  parseVTT,
  parseSRT,
  exportToVTT,
  exportToSRT,
  downloadFile,
  openFileDialog,
} from '@/utils/caption-parsers';

export function CaptionActions() {
  const {
    video,
    captionFile,
    setCaptionFile,
    transcription,
    uploadVideoToBackend,
    startTranscription,
    checkTranscriptionStatus,
    clearTranscriptionState,
  } = useCaptionStore();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Handle caption file import
  const handleImportCaption = useCallback(async () => {
    if (!video.isReady) {
      alert('Please upload a video first');
      return;
    }

    setIsImporting(true);
    try {
      const file = await openFileDialog('.vtt,.srt');
      console.log('📁 Importing caption file:', file.name);

      const content = await file.text();
      let captionFileData;

      if (file.name.toLowerCase().endsWith('.vtt')) {
        captionFileData = parseVTT(content, file.name);
      } else if (file.name.toLowerCase().endsWith('.srt')) {
        captionFileData = parseSRT(content, file.name);
      } else {
        throw new Error(
          'Unsupported file format. Please select a VTT or SRT file.'
        );
      }

      console.log(
        '✅ Successfully parsed',
        captionFileData.segments.length,
        'caption segments'
      );
      setCaptionFile(captionFileData);
    } catch (error) {
      console.error('Error importing caption file:', error);
      if (error instanceof Error) {
        alert(`Failed to import captions: ${error.message}`);
      }
    } finally {
      setIsImporting(false);
    }
  }, [video.isReady, setCaptionFile]);

  // Handle VTT export
  const handleExportVTT = useCallback(async () => {
    if (!captionFile || captionFile.segments.length === 0) {
      alert('No captions to export');
      return;
    }

    setIsExporting(true);
    try {
      const vttContent = exportToVTT(captionFile);
      const fileName = `${(captionFile.metadata?.title || 'captions').replace(/\s+/g, '_')}.vtt`;
      downloadFile(vttContent, fileName, 'text/vtt');
      console.log('✅ Exported VTT file:', fileName);
    } catch (error) {
      console.error('Error exporting VTT:', error);
      alert('Failed to export VTT file');
    } finally {
      setIsExporting(false);
    }
  }, [captionFile]);

  // Handle SRT export
  const handleExportSRT = useCallback(async () => {
    if (!captionFile || captionFile.segments.length === 0) {
      alert('No captions to export');
      return;
    }

    setIsExporting(true);
    try {
      const srtContent = exportToSRT(captionFile);
      const fileName = `${(captionFile.metadata?.title || 'captions').replace(/\s+/g, '_')}.srt`;
      downloadFile(srtContent, fileName, 'text/srt');
      console.log('✅ Exported SRT file:', fileName);
    } catch (error) {
      console.error('Error exporting SRT:', error);
      alert('Failed to export SRT file');
    } finally {
      setIsExporting(false);
    }
  }, [captionFile]);

  // Handle AI transcription
  const handleAITranscription = useCallback(async () => {
    if (!video.file || !video.fileName) {
      alert('Please upload a video first');
      return;
    }

    try {
      // Clear any previous transcription state
      clearTranscriptionState();

      console.log('🤖 Starting AI transcription for video:', video.fileName);

      // Step 1: Upload video file to backend
      await uploadVideoToBackend(video.file);

      console.log('✅ Video uploaded to backend, starting transcription...');

      // Step 2: Start transcription (uploadVideoToBackend sets uploadedVideoId)
      await startTranscription();

      console.log('✅ Transcription job started, polling for results...');
    } catch (error) {
      console.error('❌ Failed to start AI transcription:', error);
      if (error instanceof Error) {
        alert(`Failed to start transcription: ${error.message}`);
      }
    }
  }, [
    video.file,
    video.fileName,
    uploadVideoToBackend,
    startTranscription,
    clearTranscriptionState,
  ]);

  // Poll for transcription results when job is running
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (transcription.status === 'processing' && transcription.jobId) {
      console.log(
        '🔄 Starting transcription polling for job:',
        transcription.jobId
      );

      pollInterval = setInterval(async () => {
        try {
          await checkTranscriptionStatus();
        } catch (error) {
          console.error('❌ Error checking transcription status:', error);
          clearInterval(pollInterval);
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [transcription.status, transcription.jobId, checkTranscriptionStatus]);

  // Show success message when transcription completes
  useEffect(() => {
    if (transcription.status === 'completed') {
      console.log('🎉 AI transcription completed successfully!');
    }
  }, [transcription.status]);

  const hasVideo = video.isReady;
  const hasCaptions = captionFile && captionFile.segments.length > 0;

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Caption Actions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Import Captions */}
        <Button
          onClick={handleImportCaption}
          disabled={!hasVideo || isImporting}
          variant="outline"
          className="flex items-center justify-center"
        >
          {isImporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Import VTT/SRT
        </Button>

        {/* Generate AI Captions */}
        <Button
          onClick={handleAITranscription}
          disabled={
            !hasVideo ||
            transcription.status === 'uploading' ||
            transcription.status === 'processing'
          }
          variant="outline"
          className="flex items-center justify-center"
        >
          {transcription.status === 'uploading' ||
          transcription.status === 'processing' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {transcription.status === 'uploading'
            ? 'Uploading...'
            : transcription.status === 'processing'
              ? 'Generating...'
              : 'AI Generate'}
        </Button>

        {/* Export VTT */}
        <Button
          onClick={handleExportVTT}
          disabled={!hasCaptions || isExporting}
          variant="outline"
          className="flex items-center justify-center"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export VTT
        </Button>

        {/* Export SRT */}
        <Button
          onClick={handleExportSRT}
          disabled={!hasCaptions || isExporting}
          variant="outline"
          className="flex items-center justify-center"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Export SRT
        </Button>
      </div>

      {/* Status Messages */}
      <div className="mt-3 text-xs text-gray-500">
        {!hasVideo && <p>Upload a video to import captions</p>}
        {transcription.status === 'error' && transcription.error && (
          <p className="text-red-600">❌ {transcription.error}</p>
        )}
        {transcription.status === 'uploading' && (
          <p className="text-blue-600">🚀 Uploading video to AI service...</p>
        )}
        {transcription.status === 'processing' && (
          <p className="text-blue-600">
            🤖 AI is generating captions... This may take a moment.
          </p>
        )}
        {transcription.status === 'completed' && (
          <p className="text-green-600">
            ✅ AI transcription completed successfully!
          </p>
        )}
        {hasVideo && !hasCaptions && transcription.status === 'idle' && (
          <p>Import caption files or generate with AI</p>
        )}
        {hasCaptions && (
          <p>
            {captionFile.segments.length} segments loaded •{' '}
            {(captionFile.format || 'VTT').toUpperCase()} format
          </p>
        )}
      </div>
    </div>
  );
}
