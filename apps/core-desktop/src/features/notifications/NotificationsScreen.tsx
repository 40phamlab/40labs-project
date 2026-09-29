import * as React from 'react';
import {
  PageViewport,
  PageContent,
  ConfirmDialog,
} from '@40labs/ui-components';
import { Mail } from 'lucide-react';
import type { MessageChannel } from '@40labs/types';
import { NotificationsListPanel } from './components/NotificationsListPanel';
import { NotificationDetailPanel } from './components/NotificationDetailPanel';
import { NewConversationModal, ContactOption } from './components/NewConversationModal';
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
    createNotification,
  } = useNotifications();

  const [categoryFilter, setCategoryFilter] = React.useState<string | null>(null);
  const [channelFilter, setChannelFilter] = React.useState<'all' | MessageChannel>('all');
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [archiveTargetId, setArchiveTargetId] = React.useState<string | null>(null);
  const [isNewConversationOpen, setIsNewConversationOpen] = React.useState(false);
  const [isNarrowScreen, setIsNarrowScreen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsNarrowScreen(window.innerWidth < 900);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleStartNewConversation = React.useCallback(
    async (contact: ContactOption, initialMessage: string, channel: MessageChannel) => {
      const newNotif = await createNotification({
        sender_name: contact.name,
        sender_address: contact.identifier,
        body: initialMessage || `Hello ${contact.name}, starting new conversation workflow.`,
        category: contact.type === 'Customer' || contact.type === 'Patient' ? 'customers' : 'business',
        channel,
      });
      if (newNotif && newNotif.id) {
        setSelectedId(newNotif.id);
      }
      setIsNewConversationOpen(false);
    },
    [createNotification, setSelectedId]
  );

  return (
    <PageViewport>
      {/* Content Area - Starts directly at top boundary */}
      <PageContent scrollable={false} variant="transparent" padding="none">
        <div className="flex flex-row gap-3 w-full h-full overflow-hidden p-3">
          {/* Responsive Layout: On narrow screens, show list OR detail. On wide screens, show both side-by-side. */}
          {isNarrowScreen ? (
            <div className="w-full h-full overflow-hidden">
              {selectedNotification ? (
                <NotificationDetailPanel
                  notification={selectedNotification}
                  onMarkAsRead={(id) => markAsRead(id)}
                  onArchive={(id) => archiveNotification(id)}
                  onDelete={(id) => setDeleteTargetId(id)}
                  onSendReply={handleSendReply}
                  onBack={() => setSelectedId(null)}
                />
              ) : (
                <NotificationsListPanel
                  notifications={notifications}
                  selectedId={selectedId}
                  categoryFilter={categoryFilter}
                  channelFilter={channelFilter}
                  onSelectNotification={handleSelectNotification}
                  onCategoryChange={setCategoryFilter}
                  onChannelChange={setChannelFilter}
                  onArchiveNotification={(id) => setArchiveTargetId(id)}
                  onDeleteNotification={(id) => setDeleteTargetId(id)}
                  onMarkAllRead={handleMarkAllRead}
                  onNewConversation={() => setIsNewConversationOpen(true)}
                  isLoading={isLoading}
                  onRefresh={() => refetch()}
                />
              )}
            </div>
          ) : (
            <>
              {/* Left List Pane (Inbox / Conversations List) */}
              <div className="w-[300px] lg:w-[350px] shrink-0 h-full overflow-hidden">
                <NotificationsListPanel
                  notifications={notifications}
                  selectedId={selectedId}
                  categoryFilter={categoryFilter}
                  channelFilter={channelFilter}
                  onSelectNotification={handleSelectNotification}
                  onCategoryChange={setCategoryFilter}
                  onChannelChange={setChannelFilter}
                  onArchiveNotification={(id) => setArchiveTargetId(id)}
                  onDeleteNotification={(id) => setDeleteTargetId(id)}
                  onMarkAllRead={handleMarkAllRead}
                  onNewConversation={() => setIsNewConversationOpen(true)}
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
                      Select a conversation from the inbox list on the left or click <strong className="text-text">+ New</strong> to start a new conversation.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </PageContent>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isNewConversationOpen}
        onClose={() => setIsNewConversationOpen(false)}
        onStartConversation={handleStartNewConversation}
      />

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
