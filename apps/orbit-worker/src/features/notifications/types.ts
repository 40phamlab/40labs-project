// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#notifications]

export type NotificationAudience = 'broadcast' | 'role' | 'direct' | 'alert';
export type NotificationSeverity = 'info' | 'alert';

export interface StaffNotificationItem {
  id: string;
  senderUserId: string;
  senderName: string;
  audience: NotificationAudience;
  targetRole?: string | null;
  targetUserId?: string | null;
  severity: NotificationSeverity;
  subject: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}

export interface StaffRosterMember {
  id: string;
  displayName: string;
  jobRole: string;
}
