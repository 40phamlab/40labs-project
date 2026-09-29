import * as React from 'react';
import {
  PageViewport,
  PageContent,
  ConfirmDialog,
} from '@40labs/ui-components';
import { Mail } from 'lucide-react';
import { NotificationsListPanel } from './components/NotificationsListPanel';
import { NotificationDetailPanel } from './components/NotificationDetailPanel';
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
      {/* Content Area - Starts directly at top boundary, removing unnecessary vertical header space */}
      <PageContent scrollable={false} variant="transparent" padding="none">
        <div className="flex flex-row gap-3 w-full h-full overflow-hidden p-3">
          {/* Left List Pane (Inbox / Conversations List) */}
          <div className="w-[300px] lg:w-[350px] shrink-0 h-full overflow-hidden">
            <NotificationsListPanel
              notifications={notifications}
              selectedId={selectedId}
              categoryFilter={categoryFilter}
              onSelectNotification={handleSelectNotification}
              onCategoryChange={setCategoryFilter}
              onArchiveNotification={(id) => setArchiveTargetId(id)}
              onDeleteNotification={(id) => setDeleteTargetId(id)}
              onMarkAllRead={handleMarkAllRead}
              isLoading={isLoading}
              onRefresh={() => refetch()}
            />
          </div>

          {/* Right Main Conversation Workspace */}
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
              <div className="w-full h-full flex flex-col items-center justify-center bg-panel border border-border/40 rounded-card p-8 text-center shadow-xs">
                <div className="w-14 h-14 rounded-full bg-panel-strong/60 flex items-center justify-center text-text-muted mb-3 border border-border/30">
                  <Mail size={28} />
                </div>
                <h3 className="text-sm font-bold text-text mb-1">No Conversation Selected</h3>
                <p className="text-xs text-text-muted max-w-md">
                  Select a conversation from the inbox list on the left to view message history, details, and reply.
                </p>
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
