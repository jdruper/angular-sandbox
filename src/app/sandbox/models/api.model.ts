/**
 * API layer interfaces - raw HTTP request/response models
 * 
 * This file contains standardized interfaces for handling HTTP communication
 * between the client and server. These models represent the raw data structures
 * that are sent and received over the network.
 */

/**
 * Standard error response format for API operations
 * 
 * This interface defines the structure of error responses returned by the API
 * when operations fail. It provides a consistent error format across all
 * API endpoints.
 * 
 * @example
 * ```typescript
 * const errorResponse: ApiErrorResponse = {
 *   error: "Invalid barcode format",
 *   status: 400
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Usage in error handling
 * try {
 *   const result = await apiCall();
 * } catch (error) {
 *   if (error.response?.data) {
 *     const apiError = error.response.data as ApiErrorResponse;
 *     console.error(`API Error ${apiError.status}: ${apiError.error}`);
 *   }
 * }
 * ```
 */
export interface ApiErrorResponse {
  /** 
   * Human-readable error message describing what went wrong
   * Should be clear and actionable for debugging purposes
   */
  error: string;
  
  /** 
   * HTTP status code indicating the type of error
   * Common values: 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Internal Server Error)
   */
  status: number;
}