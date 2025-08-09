/**
 * API client for communicating with the Caption Editor backend
 */

const API_BASE_URL = 'http://localhost:8000/api';

export interface VideoUploadResponse {
  video_id: string;
  filename: string;
  size: number;
  duration?: number;
  message: string;
}

export interface TranscriptionRequest {
  video_id?: string;
  video_url?: string;
  language?: string;
}

export interface TranscriptionResponse {
  status: string;
  job_id?: string;
  captions?: any; // Will be replaced with proper CaptionFile type
  message: string;
}

export class ApiClient {
  private static instance: ApiClient;

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Upload a video file to the backend
   */
  async uploadVideo(file: File): Promise<VideoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/videos/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload video');
    }

    return response.json();
  }

  /**
   * Start AI transcription of a video
   */
  async startTranscription(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const response = await fetch(`${API_BASE_URL}/captions/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to start transcription');
    }

    return response.json();
  }

  /**
   * Get transcription result by job ID
   */
  async getTranscriptionResult(jobId: string): Promise<TranscriptionResponse> {
    const response = await fetch(`${API_BASE_URL}/captions/transcribe/${jobId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get transcription result');
    }

    return response.json();
  }

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{ status: string; message: string; version: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error('Backend health check failed');
    }

    return response.json();
  }
}

export const apiClient = ApiClient.getInstance();