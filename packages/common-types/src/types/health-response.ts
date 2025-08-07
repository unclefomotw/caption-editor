/* Generated from health-response.json - DO NOT EDIT MANUALLY */

/**
 * Health check response model
 */
export interface HealthResponse {
  /**
   * Health status
   */
  status: "healthy" | "unhealthy";
  /**
   * Health status message
   */
  message: string;
  /**
   * API version
   */
  version?: string;
  /**
   * Health check timestamp
   */
  timestamp?: string;
}
