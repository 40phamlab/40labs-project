/** Shared HTTP contracts for the API Core administrative surface. */
export interface AdminLoginRequest { email: string; password: string }
export interface AdminLoginResponse { mfa_required: boolean; challenge_id: string; enrollment_required?: boolean; otpauth_url?: string }
export interface AdminTotpRequest { challenge_id: string; code: string }
export interface AdminTotpResponse { success: boolean; role: string }
export interface AdminUserMe { id: string; email: string; role: string }
export interface AdminSession { id: string; expires_at: string; ip?: string | null; user_agent?: string | null; revoked_at?: string | null }
export interface AdminBusinessListItem {
  business_id: string; name: string | null; region: string | null; tmda_number: string | null;
  tier: string; verification_status: string; last_sync: string | null; created_at: string;
}
export interface AdminBusinessListResponse { items: AdminBusinessListItem[]; total: number; page: number; limit: number; total_pages: number }
export interface AdminBusiness {
  business_id: string; name: string | null; region: string | null; tmda_number: string | null;
  tier: string; verification_status: string; rejection_reason: string | null; created_at: string;
}
export interface AdminBusinessStockResponse {
  items: Array<{ medicine_id: string; batch_number: string; expiry_date: string; buy_price: number; sell_price: number; quantity: number; low_stock_threshold: number }>;
  total: number; page: number; page_size: number;
  summary: { item_count: number; low_stock_count: number; expiring_soon_count: number };
}
export interface AdminBusinessSyncResponse {
  devices: Array<{ device_id: string; last_seen_at: string | null; outbox_pending: number | null; app_version: string | null }>;
  changes: Array<{ change_id: string; entity: string; entity_id: string; version: number; received_at: string }>;
}
export interface AdminBusinessActivityResponse { activity: Array<{ action: string; admin: string; business_id: string; payload: Record<string, unknown> | null; created_at: string }> }
export type AdminVerificationDecision = 'verified' | 'rejected' | 'suspended';
export interface AdminVerificationRequest { decision: AdminVerificationDecision; reason?: string }
export interface AdminVerificationResponse { success: boolean; status: string }
export interface AdminOverviewResponse {
  kpis: { registered_businesses: number; verified_percentage: number; pending_count: number; active_businesses: number; platform_sales_today: number; open_infra_alerts: number };
  signups_per_day: Array<{ date: string; count: number }>;
  platform_daily_sales: Array<{ date: string; revenue: number }>;
  needs_attention: Array<{ type: string; id: string; name: string; description: string; time: string; link: string }>;
}
export interface AdminRevenueResponse { range: string; group: string; revenue_data: Array<{ bucket: string; revenue: number; region: string; tier: string }>; tier_distribution: Record<string, number> }
export interface AdminProductsResponse { metric: string; limit: number; products: Array<{ medicine_id: string; units?: number; revenue?: number; stockouts?: number }> }
export interface AdminGrowthResponse { signups_per_week: Array<{ week: string; signups: number }>; activation_rate_pct: number; total_registered: number; activated_businesses: number; verified_count: number; unverified_count: number }
export interface AdminDevice {
  device_id: string; workspace_id: string; business_id: string | null; business_name: string | null; region: string | null;
  last_seen_at: string | null; outbox_pending: number | null; app_version: string | null; status: 'healthy' | 'stale' | 'offline';
}
export interface AdminSyncChange { change_id: string; entity: string; entity_id: string; device_id: string; workspace_id: string; business_name: string | null; version: number; received_at: string }
export interface AdminSyncChangesResponse { data: AdminSyncChange[]; page: number; page_size: number; total: number }
export interface AdminSyncFailure { message: string; device_id: string | null; ts: string; meta: Record<string, unknown> | null }
export interface AdminSyncFailuresResponse { failures: Array<{ business_id: string; count: number; failures: AdminSyncFailure[] }> }
export interface AdminHealthCheck { check: string; status: 'ok' | 'degraded' | 'down'; latency_ms: number; detail: string; checked_at: string; uptime_24h: number | null }
export interface AdminInfraStateChange { level: string; source: string; message: string; ts: string }
export interface AdminInfraHealthResponse { overall: 'ok' | 'degraded' | 'down' | 'unknown'; last_checked: string | null; checks: AdminHealthCheck[]; state_changes: AdminInfraStateChange[] }
export interface AdminInfraLog { id: string; ts: string; level: string; source: string; message: string; business_id: string | null; device_id: string | null; meta: Record<string, unknown> | null }
export interface AdminInfraLogsResponse { data: AdminInfraLog[]; next_cursor: string | null }
export interface AdminWorkspace { workspace_id: string; name: string | null; branch_count: number; created_at: string | null }
export interface AdminWorkspaceListResponse { items: AdminWorkspace[]; page: number; limit: number; total: number; total_pages: number }
export interface AdminBranch { business_id: string; branch_id: string; name: string | null; region: string | null; verification_status: string; created_at: string }
export interface AdminBranchListResponse { workspace_id: string; items: AdminBranch[]; page: number; limit: number; total: number; total_pages: number }
export interface AdminUserRecord { id: string; email: string; role: 'super_admin' | 'admin' | 'reviewer' | 'viewer'; disabled_at: string | null; created_at: string }
export interface AdminUserListResponse { items: AdminUserRecord[]; page: number; limit: number; total: number; total_pages: number }
export interface AdminAuditRecord { id: string; admin_email: string | null; action: string; target_type: string; target_id: string; payload: Record<string, unknown> | null; created_at: string }
export interface AdminAuditListResponse { data: AdminAuditRecord[]; page: number; limit: number; total: number; total_pages: number }
