# Implementation Plan - Phase 6C: Notifications & Chats Empty-State Launchpad + Compact Category Strip

Transform the Notifications & Chats tab right pane (when no chat is selected) into a calm, focused, WhatsApp-Web-like empty state with three Quick Actions in the centre and a compact Category Strip pinned to the bottom.

## User Review Required

> [!IMPORTANT]
> - Reuses existing endpoints/hooks (`customersApi.list`, `partnerFacilitiesApi.list`, `findOrCreateThread`, `saveAttachment`).
> - No design token or package internals modified.
> - One thread per person: opening/searching a contact opens their existing thread or creates one without duplicates.

## Proposed Changes

### [i18n]
#### [MODIFY] [index.ts](file:///C:/dev/40Labs/packages/i18n/src/index.ts)
- Add Swahili & English keys for:
  - `notifications.launchpad.searchCustomer`: "Tafuta Mteja" / "Search customer"
  - `notifications.launchpad.newChat`: "Mazungumzo Mapya" / "New chat"
  - `notifications.launchpad.attachMedia`: "Ambatisha" / "Attach media"
  - `notifications.chat.noResults`: "Hakuna matokeo" / "No results"

### [Core Desktop Notifications Feature]
#### [NEW] [CategoryStrip.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/notifications/components/CategoryStrip.tsx)
- Compact horizontal row pinned to the bottom of the right pane (16px padding).
- Height ~56–64px, equal-width flex, gap 8–12px.
- Icon + uppercase tracked label (truncated) + count in JetBrains Mono. No subtitle.
- 2px coloured bottom accent (orange for Business/Gov/Unread-attention, green for Customers).
- Active filter state: border Green `#16A34A` + subtle tint. Counts of 0 render muted.

#### [NEW] [ChatLaunchpad.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/notifications/components/ChatLaunchpad.tsx)
- Centred in space above the category strip.
- Three action cards in a row (Search customer, New chat, Attach media), radius 12px, Surface `#F8FAFB`, hover: lift + Green border, 150ms transition.
- Icon (Green `#16A34A`, 28px) + title only.
- JetBrains Mono kbd hints (`Ctrl+K`, `Ctrl+N`, `Ctrl+U`).

#### [NEW] [ContactSearchPalette.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/notifications/components/ContactSearchPalette.tsx)
- Centred command-palette modal with autofocus input (radius 8px).
- Searches customers and partner facilities/suppliers.
- Results list with Avatar (fixed single-word initials using `NotificationAvatar`), name, phone/identifier.
- Arrow-key navigation, Enter opens existing thread (no duplicate) or creates one, Esc closes.
- Title-only "No results" empty state.

#### [MODIFY] [NotificationsScreen.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/notifications/NotificationsScreen.tsx)
- Replace `NotificationsOverviewPanel` in empty state with `ChatLaunchpad` (center) + `CategoryStrip` (pinned bottom).
- Wire up keyboard shortcuts (`Ctrl+K` for search, `Ctrl+N` for new chat, `Ctrl+U` for attach).
- Wire up attach media flow (file picker -> contact search -> pending attachment in chat input).

## Verification Plan

### Automated Tests
- Type check: `pnpm --filter @40labs/core-desktop tsc --noEmit`
- Tests run: `pnpm --filter @40labs/core-desktop test`

### Manual Verification
- Verify empty state renders `ChatLaunchpad` and `CategoryStrip` correctly at 1280px and 1920px.
- Selecting a chat hides launchpad and strip; deselecting restores them.
- Search customer -> select -> opens existing thread (no duplicate).
- Attach media -> select file -> select contact -> pending attachment in input.
