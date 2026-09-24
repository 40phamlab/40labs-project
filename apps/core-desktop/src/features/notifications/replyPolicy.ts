import type { NotificationCategory } from '@40labs/types';

/**
 * Reply eligibility policy map by sender category.
 * - Customers & Business (other pharmacies): repliable in-app
 * - Gov (TMDA, TRA) & Marketing: non-repliable in-app
 */
export const CAN_REPLY_BY_CATEGORY: Record<NotificationCategory, boolean> = {
  customers: true,
  business: true,
  gov: false,
  marketing: false,
};

export function canReplyToNotificationCategory(category: NotificationCategory): boolean {
  return CAN_REPLY_BY_CATEGORY[category] ?? false;
}
