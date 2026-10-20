# Task List - Scheduling & Campaigns Refactoring (6D & 6D-1)

- [ ] Update types in `packages/types/src/schedule.ts` (`ScheduleAttachment`, `ReportPeriodToken`, `enabled`)
- [ ] Create SQLite migration for `enabled` column and `schedule_attachments` table
- [ ] Implement `CollapsibleSection` component
- [ ] Implement `SchedulingHeader` component with chips: All · Active · Paused · Sent · Failed
- [ ] Implement `ScheduleListPane` component with search, category dropdown, collapse chevron, and single card style
- [ ] Implement `AttachmentPicker` & `AttachmentChip` components (Reports vs File, period selector)
- [ ] Implement `resolveAttachment.ts` for send-time resolution
- [ ] Refactor `NewScheduleModal.tsx` with top-level required fields, collapsed sections, and Active switch
- [ ] Refactor `ScheduleDetailPane.tsx` with collapsible sections, sticky action bar, Active switch, and audit logging for toggle
- [ ] Update `SchedulingScreen.tsx` to integrate the refactored components
- [ ] Add i18n keys for en and sw (Active, Paused, etc.)
- [ ] Verify build, type-check (`tsc --strict`), and tests
