/** Wire contracts currently implemented by services/api-core. */
export interface ApiErrorResponse {
  error: string | { code: string; message: string };
  message?: string;
  retry_after?: number;
}
export interface AdminUserMe { id: string; email: string; role: string }
export interface AdminSession { id: string; expires_at: string; ip?: string; user_agent?: string; revoked_at?: string }
export interface AdminBusinessListItem {
  business_id: string; name: string; region: string | null; tmda_number: string | null;
  tier: string; verification_status: string; last_sync: string | null; created_at: string;
}
export interface AdminBusinessListResponse {
  items: AdminBusinessListItem[]; total: number; page: number; limit: number; total_pages: number;
}
export interface AdminBusiness {
  business_id: string; name: string; region: string | null; tmda_number: string | null;
  tier: string; verification_status: string; rejection_reason: string | null; created_at: string;
}
