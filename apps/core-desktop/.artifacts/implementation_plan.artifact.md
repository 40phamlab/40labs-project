# File Explorer UI/UX Modernization & Modularization Plan

Refactor the monolithic File Explorer (`ExplorerScreen.tsx`) into modular, maintainable sub-components adhering strictly to the canonical 40Labs Design Tokens, tactile elevation, and consistent spacing/typography.

## User Review Required

> [!IMPORTANT]
> This refactor modularizes the File Explorer UI without changing any underlying Tauri IPC commands (`explorerApi.ts`), state logic, or file preview handlers (`FilePreviewProvider`). All existing unit tests (`ExplorerScreen.test.tsx`) will be preserved and verified.

## Proposed Changes

### [explorer] Component Modularization

#### [NEW] [ExplorerBreadcrumb.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/explorer/components/ExplorerBreadcrumb.tsx)
- Dedicated breadcrumb navigation with hard drive icon, path segment separators, and scrollable container.

#### [NEW] [ExplorerToolbar.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/explorer/components/ExplorerToolbar.tsx)
- Top action toolbar housing navigation history buttons (Back, Forward, Up, Refresh), action buttons (New Folder, Rename, Delete, Reveal), selection count, and View Mode switchers (List vs Grid).

#### [NEW] [ExplorerSidebarTree.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/explorer/components/ExplorerSidebarTree.tsx)
- Left collapsible directory tree with quick access ("40Labs Root", "Browse..."), folder expansion state, and active item highlighting.

#### [NEW] [ExplorerListView.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/explorer/components/ExplorerListView.tsx)
- Tokenized table view with sortable headers (`Name`, `Type`, `Size`, `Date Modified`), checkboxes, and file type icons.

#### [NEW] [ExplorerGridView.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/explorer/components/ExplorerGridView.tsx)
- Tactile card grid view with proper spacing, elevation, and file type representations.

#### [NEW] [ExplorerContextMenu.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/explorer/components/ExplorerContextMenu.tsx)
- Floating context menu for item and canvas right-click actions.

#### [NEW] [ExplorerModals.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/explorer/components/ExplorerModals.tsx)
- Consolidated modal dialogs for New Folder, Rename, and Delete Confirmation using `@40labs/ui-components` Dialog & Button.

#### [MODIFY] [ExplorerScreen.tsx](file:///C:/dev/40Labs/apps/core-desktop/src/features/explorer/ExplorerScreen.tsx)
- Streamlined container orchestrating state and composing the modular sub-components with canonical design tokens (`--color-app-bg`, `--color-surface-primary`, `.elevation-raised`, `.elevation-inset`).

## Verification Plan

### Automated Tests
- Run `npm test` or vitest for `ExplorerScreen.test.tsx` to ensure all tests pass successfully.
- Verify file preview opening, search filtering, folder creation, and selection handlers.

### Manual Verification
- Inspect UI inside the 40Labs Core Desktop App shell to verify tactile elevation, alignment, responsiveness, and light/dark theme compatibility.
