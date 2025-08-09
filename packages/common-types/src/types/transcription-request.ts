/* Generated from transcription-request.json - DO NOT EDIT MANUALLY */

/**
 * Request model for AI transcription
 */
export type TranscriptionRequest = TranscriptionRequest1 &
  TranscriptionRequest2;
export type TranscriptionRequest2 = {
  [k: string]: unknown;
};

export interface TranscriptionRequest1 {
  /**
   * URL to the video file for transcription
   */
  videoUrl?: string;
  /**
   * Base64 encoded video file content
   */
  videoFile?: string;
  /**
   * Target language for transcription
   */
  language?: string;
  options?: {
    /**
     * Enable speaker identification
     */
    speakerDiarization?: boolean;
    /**
     * Include punctuation in transcription
     */
    punctuation?: boolean;
    /**
     * Filter profanity from transcription
     */
    profanityFilter?: boolean;
  };
}
