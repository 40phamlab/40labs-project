/** Wire contracts currently implemented by services/api-core. */
export interface ApiErrorResponse {
  error: string | { code: string; message: string };
  message?: string;
  retry_after?: number;
}
