/* Generated from caption-segment.json - DO NOT EDIT MANUALLY */

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
