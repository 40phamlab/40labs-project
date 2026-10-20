# Scheduling & Campaigns Refactoring Plan (Phase 6D & 6D-1)

Refactor Scheduling & Campaigns to streamline the UI into a single filter system, collapsible everything, a lean create/edit flow, system report attachments (`40LabsCore` reports), and an orthogonal `Active` (`enabled`) toggle with compliance audit logging.

## User Review Required

> [!IMPORTANT]
> - **Compliance Report Gate**: Compliance & Audit reports carry fiscal and audit data. Default behavior: hide the "Compliance & Audit" option from the picker for non-owner roles (flagged, not implemented with a full role system yet).
> - **Customer Analytics**: Restrict to aggregate view in v1.
> - **PDF Export Builder (Phase 7C)**: If 7C export builder is not callable outside Reports, we ship the picker and persistence with `TODO: [reason: 7C export builder not reusable] [phase: 6E]`.

## Proposed Changes

### Types & Database
#### [MODIFY] [schedule.ts](file:///C:/dev/40Labs/packages/types/src/schedule.ts)
- Add `ScheduleAttachment`, `ReportPeriodToken`.
- Add `enabled: boolean` to `Schedule`.

#### [NEW] [Migration 0007](file:///C:/dev/40Labs/infra/db/sqlite-schema/migrations/0007_scheduling_enhancements.sql)
- Add `enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1))` to `schedules`.
- Create `schedule_attachments` table to store structured report/file definitions per schedule.

### Services & API
#### [MODIFY] [scheduling module in api-core / spec file]
- Update endpoints GET/POST/PATCH `/schedules` to support `attachments[]` and `enabled`.

### UI Components (Feature Folder)
#### [NEW] [CollapsibleSection.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/scheduling/components/CollapsibleSection.tsx)
- Reusable collapsible block with chevron rotating 90°→0, 150ms transition, titles only, no helper text.

#### [NEW] [SchedulingHeader.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/scheduling/components/SchedulingHeader.tsx)
- Header chips: **All · Active · Paused · Sent · Failed** with counts and color dots.
- Right side: **New Schedule** (primary green `#16A34A`, no plus in label text, one icon only `Plus`) and refresh icon.

#### [NEW] [ScheduleListPane.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/scheduling/components/ScheduleListPane.tsx)
- Search icon (expands inline on click) and compact category dropdown (8px radius).
- Collapse chevron on pane edge with session state persistence (`storePanelOpen` pattern).
- Single card style: title, category tag, status badge (plus Paused badge if `!enabled`), date. Selected = orange border (`#F97316`).

#### [NEW] [ScheduleDetailPane.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/scheduling/components/ScheduleDetailPane.tsx)
- Header with category tag, status badge, Active Switch, ID (mono), title.
- CollapsibleSections: Summary (inline row), Delivery, Message preview, Attachments, History.
- Sticky action bar (`Send Now | Edit | More`) below scroll region. Pause/Resume in `More` menu. Audit log entry before toggle mutation.

#### [NEW] [AttachmentPicker.tsx & AttachmentChip.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/scheduling/components/AttachmentPicker.tsx)
- Segmented control: Reports | File.
- Reports source: Sales & Revenue, Inventory & Stock, Customer Analytics, Purchases & Suppliers, Compliance & Audit (mapped to `ReportTabId`).
- Period selector: Previous day | Previous week | Previous month | Custom range.
- Removable chips displaying report title and period label.

#### [NEW] [NewScheduleModal.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/scheduling/NewScheduleModal.tsx)
- Top-level required fields only: Title · Category · Recipients · Channels · When.
- Collapsed CollapsibleSections by default for Message and Attach (auto-open if content exists).
- Footer: Cancel and Save (green `#16A34A`), Active switch (default on). Inline validation, no helper text.

#### [NEW] [resolveAttachment.ts](file:///C:/dev/40Labs/apps/core-desktop/src/features/scheduling/lib/resolveAttachment.ts)
- Send-time resolution logic (`resolveAttachment(att, sentAt)`).

### i18n
#### [MODIFY] [i18n keys]
- Add sw and en keys for Active, Paused, Pause, Resume, and report labels.

## Verification Plan

### Automated Tests
- Run `tsc --strict` to ensure no type errors.
- Verify unit tests for schedule attachments and Active/Paused filtering.

### Manual Verification
- Test header chips, card filtering, collapsible sections, New Schedule modal, and attachment picker.
