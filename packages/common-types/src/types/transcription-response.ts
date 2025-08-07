/* Generated from transcription-response.json - DO NOT EDIT MANUALLY */

/**
 * Response model for AI transcription
 */
export interface TranscriptionResponse {
  /**
   * Current status of the transcription job
   */
  status: "queued" | "processing" | "completed" | "failed";
  /**
   * Unique identifier for the transcription job
   */
  jobId?: string;
  captions?: CaptionFile;
  /**
   * Human-readable status message
   */
  message: string;
  error?: {
    /**
     * Error code
     */
    code: string;
    /**
     * Error message
     */
    message: string;
    /**
     * Additional error details
     */
    details?: {
      [k: string]: unknown;
    };
  };
}
/**
 * Transcribed captions (only when status is completed)
 */
export interface CaptionFile {
  /**
   * Array of caption segments
   */
  segments: CaptionSegment[];
  /**
   * Language code (ISO 639-1)
   */
  language?: string;
  /**
   * Caption file format
   */
  format?: "vtt" | "srt" | "ass" | "sbv";
  /**
   * Optional metadata about the caption file
   */
  metadata?: {
    /**
     * Title of the video/content
     */
    title?: string;
    /**
     * Total duration in seconds
     */
    duration?: number;
    /**
     * Creation timestamp
     */
    createdAt?: string;
    /**
     * Last modification timestamp
     */
    modifiedAt?: string;
  };
}
/**
 * A single caption segment with timing and text
 */
export interface CaptionSegment {
  /**
   * Unique identifier for the caption segment
   */
  id: string;
  /**
   * Start time of the caption in seconds
   */
  startTime: number;
  /**
   * End time of the caption in seconds
   */
  endTime: number;
  /**
   * Caption text content
   */
  text: string;
  /**
   * AI transcription confidence score (0-1)
   */
  confidence?: number;
  /**
   * Speaker identifier (optional)
   */
  speaker?: string;
}
