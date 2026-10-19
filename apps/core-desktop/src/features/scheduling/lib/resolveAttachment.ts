import type { ScheduleAttachment } from '@40labs/types';

/**
 * Send-time resolution for schedule attachments (reports vs files).
 * Report attachments are definitions resolved at send time against intended period.
 */
export async function resolveAttachment(att: ScheduleAttachment, sentAt: string): Promise<string> {
  if (att.kind === 'file') {
    return att.file_id;
  }

  // Report resolution at send time
  // TODO: [reason: 7C export builder not reusable] [phase: 6E]
  const periodText = typeof att.period === 'string' ? att.period : `Custom (${att.period.from} to ${att.period.to})`;
  return `[PDF Report: ${att.report} | Period: ${periodText} | Resolved at: ${sentAt}]`;
}
