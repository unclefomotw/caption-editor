/* Generated from caption-file.json - DO NOT EDIT MANUALLY */

/**
 * A complete caption file containing multiple segments
 */
export interface CaptionFile {
  /**
   * Unique identifier for the caption file
   */
  id?: string;
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
  format?: 'vtt' | 'srt' | 'ass' | 'sbv';
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
