import * as React from 'react';
import { ConfirmDialog } from '@40labs/ui-components';
import { NotificationsListPanel } from './NotificationsListPanel';
import { NotificationDetailPanel } from './NotificationDetailPanel';
import { NotificationsOverviewPanel } from './NotificationsOverviewPanel';
import { useNotificationsStore } from '../../stores/useNotificationsStore';

export const NotificationsScreen: React.FC = () => {
  const notifications = useNotificationsStore((s) => s.notifications);
  const selectedId = useNotificationsStore((s) => s.selectedNotificationId);
  const setSelectedId = useNotificationsStore((s) => s.setSelectedNotificationId);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const archiveNotification = useNotificationsStore((s) => s.archiveNotification);

  const [categoryFilter, setCategoryFilter] = React.useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);

  const activeNotifications = React.useMemo(() => {
    return notifications.filter((n) => n.status !== 'archived');
  }, [notifications]);

  const selectedNotification = React.useMemo(() => {
    if (!selectedId) return null;
    return notifications.find((n) => n.id === selectedId) || null;
  }, [notifications, selectedId]);

  const handleConfirmDelete = React.useCallback(() => {
    if (deleteTargetId) {
      archiveNotification(deleteTargetId);
      if (selectedId === deleteTargetId) {
        setSelectedId(null);
      }
    }
    setDeleteTargetId(null);
  }, [deleteTargetId, archiveNotification, selectedId, setSelectedId]);

  const handleSelectNotification = React.useCallback(
    (id: string) => {
      setSelectedId(id);
      markAsRead(id);
    },
    [setSelectedId, markAsRead]
  );

  const handleSendReply = React.useCallback((id: string, replyText: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const replyFormatted = `\n\n--- You replied (${timestamp}) ---\n${replyText}`;

    useNotificationsStore.setState((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id
          ? { ...n, body: (n.body || '') + replyFormatted, status: 'read' }
          : n
      ),
    }));
  }, []);

  return (
    <div className="p-6 h-full w-full overflow-hidden flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text font-heading">Notifications Center</h1>
          <p className="text-xs text-text-muted">
            Track alerts, government notices, customer inquiries, and business communications.
          </p>
        </div>
      </div>

      {/* Two-Pane Shell */}
      <div className="flex flex-row gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left List Pane */}
        <div className="w-1/3 min-w-[320px] h-full overflow-hidden">
          <NotificationsListPanel
            notifications={activeNotifications}
            selectedId={selectedId}
            categoryFilter={categoryFilter}
            onSelectNotification={handleSelectNotification}
            onCategoryChange={setCategoryFilter}
            onDeleteNotification={(id) => setDeleteTargetId(id)}
          />
        </div>

        {/* Right Detail / Overview Pane */}
        <div className="flex-1 h-full overflow-hidden">
          {selectedNotification ? (
            <NotificationDetailPanel
              notification={selectedNotification}
              onMarkAsRead={markAsRead}
              onArchive={archiveNotification}
              onDelete={(id) => setDeleteTargetId(id)}
              onSendReply={handleSendReply}
            />
          ) : (
            <div className="h-full overflow-y-auto pr-1 custom-scrollbar">
              <NotificationsOverviewPanel
                notifications={activeNotifications}
                activeCategory={categoryFilter}
                onSelectCategory={setCategoryFilter}
              />
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Archive this notification?"
        message="Are you sure you want to archive this notification? It will be removed from your active notifications list."
        confirmText="Confirm Archive"
        cancelText="Keep"
        intent="danger"
      />
    </div>
  );
};
