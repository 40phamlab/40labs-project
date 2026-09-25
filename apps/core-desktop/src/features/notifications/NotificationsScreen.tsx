import * as React from 'react';
import { PageViewport, PageHeader, PageContent, ConfirmDialog } from '@40labs/ui-components';
import { NotificationsListPanel } from './components/NotificationsListPanel';
import { NotificationDetailPanel } from './components/NotificationDetailPanel';
import { NotificationsOverviewPanel } from './components/NotificationsOverviewPanel';
import { useNotifications } from '../../hooks/useNotifications';

export const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    selectedNotificationId: selectedId,
    setSelectedNotificationId: setSelectedId,
    markAsRead,
    archiveNotification,
    sendReply,
  } = useNotifications();

  const [categoryFilter, setCategoryFilter] = React.useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);

  const activeNotifications = React.useMemo(() => {
    return notifications.filter((n) => n.status !== 'archived');
  }, [notifications]);

  const selectedNotification = React.useMemo(() => {
    if (!selectedId) return null;
    return notifications.find((n) => n.id === selectedId) || null;
  }, [notifications, selectedId]);

  const handleConfirmDelete = React.useCallback(async () => {
    if (deleteTargetId) {
      await archiveNotification(deleteTargetId);
      if (selectedId === deleteTargetId) {
        setSelectedId(null);
      }
    }
    setDeleteTargetId(null);
  }, [deleteTargetId, archiveNotification, selectedId, setSelectedId]);

  const handleSelectNotification = React.useCallback(
    async (id: string) => {
      setSelectedId(id);
      await markAsRead(id);
    },
    [setSelectedId, markAsRead]
  );

  const handleSendReply = React.useCallback(
    async (id: string, replyText: string) => {
      await sendReply(id, replyText);
    },
    [sendReply]
  );

  return (
    <PageViewport>
      <PageHeader
        title="Notifications Center"
        subtitle="Track alerts, government notices, customer inquiries, and business communications."
      />

      <PageContent scrollable={false} padding="normal">
        <div className="flex flex-row gap-6 w-full h-full overflow-hidden">
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
                onMarkAsRead={(id) => markAsRead(id)}
                onArchive={(id) => archiveNotification(id)}
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
      </PageContent>

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
    </PageViewport>
  );
};
