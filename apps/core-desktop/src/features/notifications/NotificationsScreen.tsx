import * as React from 'react';
import {
  PageViewport,
  PageToolbar,
  PageContent,
  ConfirmDialog,
  IconButton,
  Button,
} from '@40labs/ui-components';
import { RefreshCw, CheckCheck } from 'lucide-react';
import { NotificationsListPanel } from './components/NotificationsListPanel';
import { NotificationDetailPanel } from './components/NotificationDetailPanel';
import { NotificationsOverviewPanel } from './components/NotificationsOverviewPanel';
import { useNotifications } from '../../hooks/useNotifications';

export const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    isLoading,
    refetch,
    selectedNotificationId: selectedId,
    setSelectedNotificationId: setSelectedId,
    markAsRead,
    archiveNotification,
    deleteNotification,
    sendReply,
  } = useNotifications();

  const [categoryFilter, setCategoryFilter] = React.useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [archiveTargetId, setArchiveTargetId] = React.useState<string | null>(null);

  const selectedNotification = React.useMemo(() => {
    if (!selectedId) return null;
    return notifications.find((n) => n.id === selectedId) || null;
  }, [notifications, selectedId]);

  const handleConfirmArchive = React.useCallback(async () => {
    if (archiveTargetId) {
      await archiveNotification(archiveTargetId);
      if (selectedId === archiveTargetId) {
        setSelectedId(null);
      }
    }
    setArchiveTargetId(null);
  }, [archiveTargetId, archiveNotification, selectedId, setSelectedId]);

  const handleConfirmDelete = React.useCallback(async () => {
    if (deleteTargetId) {
      await deleteNotification(deleteTargetId);
      if (selectedId === deleteTargetId) {
        setSelectedId(null);
      }
    }
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteNotification, selectedId, setSelectedId]);

  const handleSelectNotification = React.useCallback(
    async (id: string) => {
      setSelectedId(id);
      await markAsRead(id);
    },
    [setSelectedId, markAsRead]
  );

  const handleMarkAllRead = React.useCallback(async () => {
    const unread = notifications.filter((n) => n.status === 'unread');
    for (const notif of unread) {
      await markAsRead(notif.id);
    }
  }, [notifications, markAsRead]);

  const handleSendReply = React.useCallback(
    async (id: string, replyText: string) => {
      await sendReply(id, replyText);
    },
    [sendReply]
  );

  return (
    <PageViewport>
      {/* Page Toolbar */}
      <PageToolbar
        right={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              intent="neutral"
              size="sm"
              leftIcon={<CheckCheck size={14} />}
              onClick={handleMarkAllRead}
            >
              Mark All as Read
            </Button>
            <IconButton
              icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              label="Refresh notifications"
              intent="ghost"
              size="sm"
              onClick={() => refetch()}
            />
          </div>
        }
      />

      {/* Content */}
      <PageContent scrollable={false} variant="transparent" padding="none">
        <div className="flex flex-row gap-3.5 w-full h-full overflow-hidden">
          {/* Left List Pane */}
          <div className="w-[320px] shrink-0 h-full overflow-hidden">
            <NotificationsListPanel
              notifications={notifications}
              selectedId={selectedId}
              categoryFilter={categoryFilter}
              onSelectNotification={handleSelectNotification}
              onCategoryChange={setCategoryFilter}
              onArchiveNotification={(id) => setArchiveTargetId(id)}
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
                  notifications={notifications}
                  activeCategory={categoryFilter}
                  onSelectCategory={setCategoryFilter}
                />
              </div>
            )}
          </div>
        </div>
      </PageContent>

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        isOpen={Boolean(archiveTargetId)}
        onClose={() => setArchiveTargetId(null)}
        onConfirm={handleConfirmArchive}
        title="Archive this notification?"
        message="Are you sure you want to archive this notification? It will be moved to your archived notifications list."
        confirmText="Confirm Archive"
        cancelText="Cancel"
        intent="primary"
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete this notification permanently?"
        message="Are you sure you want to permanently delete this notification? This action cannot be undone."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        intent="danger"
      />
    </PageViewport>
  );
};
