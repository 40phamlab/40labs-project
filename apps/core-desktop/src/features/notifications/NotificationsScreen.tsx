import * as React from 'react';
import { ConfirmDialog } from '@40labs/ui-components';
import { Mail } from 'lucide-react';
import type { MessageChannel, Thread } from '@40labs/types';
import { TabContainer } from '../../components/TabContainer';
import { ThreadList } from './components/ThreadList';
import { ChatPane } from './components/ChatPane';
import { NewConversationModal, ContactOption } from './components/NewConversationModal';
import { useNotifications, useNotificationMessages } from '../../hooks/useNotifications';
import { useToast } from '../../hooks/useToast';

export function useThreads(notifications: any[]) {
  return React.useMemo(() => {
    const threadMap = new Map<string, Thread & { notificationIds: string[] }>();

    for (const n of notifications) {
      const key = `${n.category}_${n.sender_name}`;
      if (!threadMap.has(key)) {
        let cType: any = 'customer';
        if (n.category === 'gov' || n.sender_name.toUpperCase().includes('TMDA') || n.sender_name.toUpperCase().includes('TRA')) {
          cType = 'gov';
        } else if (n.category === 'business') {
          cType = 'business';
        } else if (n.category === 'marketing') {
          cType = 'marketing';
        } else {
          cType = 'customer';
        }

        threadMap.set(key, {
          id: key,
          workspace_id: n.workspace_id,
          branch_id: n.branch_id,
          counterparty_type: cType,
          counterparty_id: n.sender_business_id,
          display_name: n.sender_name,
          last_message_at: n.received_at || n.created_at,
          unread_count: n.status === 'unread' ? 1 : 0,
          archived: n.status === 'archived',
          last_message_preview: n.body,
          created_at: n.created_at || new Date().toISOString(),
          updated_at: n.updated_at || new Date().toISOString(),
          notificationIds: [n.id],
        });
      } else {
        const t = threadMap.get(key)!;
        t.notificationIds.push(n.id);
        if (n.status === 'unread') {
          t.unread_count += 1;
        }
        if (new Date(n.received_at || n.created_at) > new Date(t.last_message_at)) {
          t.last_message_at = n.received_at || n.created_at;
          t.last_message_preview = n.body;
        }
      }
    }

    return Array.from(threadMap.values()).sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
  }, [notifications]);
}

export const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    isLoading,
    refetch,
    markAsRead,
    archiveNotification,
    deleteNotification,
    createNotification,
  } = useNotifications();

  const threads = useThreads(notifications);
  const [selectedThreadId, setSelectedThreadId] = React.useState<string | null>(null);

  const selectedThread = React.useMemo(() => {
    if (!selectedThreadId) return null;
    return threads.find((t) => t.id === selectedThreadId) || null;
  }, [threads, selectedThreadId]);

  const activeNotificationId = selectedThread?.notificationIds[0] || null;
  const { messages, sendMessage } = useNotificationMessages(activeNotificationId);
  const { toast } = useToast();

  const [deleteTargetThreadId, setDeleteTargetThreadId] = React.useState<string | null>(null);
  const [archiveTargetThreadId, setArchiveTargetThreadId] = React.useState<string | null>(null);
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

  const handleSelectThread = React.useCallback(
    async (threadId: string) => {
      setSelectedThreadId(threadId);
      const t = threads.find((th) => th.id === threadId);
      if (t) {
        for (const notifId of t.notificationIds) {
          await markAsRead(notifId);
        }
      }
    },
    [threads, markAsRead]
  );

  const handleConfirmArchive = React.useCallback(async () => {
    if (archiveTargetThreadId) {
      const t = threads.find((th) => th.id === archiveTargetThreadId);
      if (t) {
        for (const notifId of t.notificationIds) {
          await archiveNotification(notifId);
        }
      }
      if (selectedThreadId === archiveTargetThreadId) {
        setSelectedThreadId(null);
      }
    }
    setArchiveTargetThreadId(null);
  }, [archiveTargetThreadId, threads, archiveNotification, selectedThreadId]);

  const handleConfirmDelete = React.useCallback(async () => {
    if (deleteTargetThreadId) {
      const t = threads.find((th) => th.id === deleteTargetThreadId);
      if (t) {
        for (const notifId of t.notificationIds) {
          await deleteNotification(notifId);
        }
      }
      if (selectedThreadId === deleteTargetThreadId) {
        setSelectedThreadId(null);
      }
    }
    setDeleteTargetThreadId(null);
  }, [deleteTargetThreadId, threads, deleteNotification, selectedThreadId]);

  const handleSendReply = React.useCallback(
    async (replyText: string, attachmentIds: string[] = []) => {
      if (!activeNotificationId) return;
      try {
        await sendMessage({ notificationId: activeNotificationId, body: replyText, attachmentIds });
      } catch (err) {
        console.error('Failed to send message:', err);
        toast.error('Message was not sent.');
        throw err;
      }
    },
    [activeNotificationId, sendMessage, toast]
  );

  const handleStartNewConversation = React.useCallback(
    async (contacts: ContactOption[], channel: MessageChannel) => {
      const results = await Promise.allSettled(contacts.map((contact) => createNotification({
        sender_name: contact.name,
        sender_address: contact.identifier,
        body: '',
        category: 'customers',
        channel,
        recipient_customer_id: contact.id,
      })));
      const created = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
      if (created[0]?.id) {
        const firstKey = `customers_${created[0].sender_name}`;
        setSelectedThreadId(firstKey);
      }
      return { failedContactIds: [], createdCount: created.length };
    },
    [createNotification]
  );

  return (
    <TabContainer
      overlays={
        <>
          <NewConversationModal
            isOpen={isNewConversationOpen}
            onClose={() => setIsNewConversationOpen(false)}
            onStartConversation={handleStartNewConversation}
          />

          <ConfirmDialog
            isOpen={Boolean(archiveTargetThreadId)}
            onClose={() => setArchiveTargetThreadId(null)}
            onConfirm={handleConfirmArchive}
            title="Archive this conversation?"
            message="This action will move the conversation to your archive."
            confirmText="Confirm Archive"
            cancelText="Cancel"
            intent="primary"
          />

          <ConfirmDialog
            isOpen={Boolean(deleteTargetThreadId)}
            onClose={() => setDeleteTargetThreadId(null)}
            onConfirm={handleConfirmDelete}
            title="Delete this conversation permanently?"
            message="This action cannot be undone."
            confirmText="Delete Permanently"
            cancelText="Cancel"
            intent="danger"
          />
        </>
      }
    >
      <div className="flex flex-row gap-3 w-full h-full overflow-hidden">
        {isNarrowScreen ? (
          <div className="w-full h-full overflow-hidden">
            {selectedThread ? (
              <ChatPane
                thread={selectedThread}
                messages={messages}
                onSendReply={handleSendReply}
                onArchive={(id) => setArchiveTargetThreadId(id)}
                onDelete={(id) => setDeleteTargetThreadId(id)}
              />
            ) : (
              <ThreadList
                threads={threads}
                selectedId={selectedThreadId}
                onSelectThread={handleSelectThread}
                onArchiveThread={(id) => setArchiveTargetThreadId(id)}
                onDeleteThread={(id) => setDeleteTargetThreadId(id)}
                onNewConversation={() => setIsNewConversationOpen(true)}
                isLoading={isLoading}
                onRefresh={() => refetch()}
              />
            )}
          </div>
        ) : (
          <>
            <div className="h-full overflow-hidden shrink-0">
              <ThreadList
                threads={threads}
                selectedId={selectedThreadId}
                onSelectThread={handleSelectThread}
                onArchiveThread={(id) => setArchiveTargetThreadId(id)}
                onDeleteThread={(id) => setDeleteTargetThreadId(id)}
                onNewConversation={() => setIsNewConversationOpen(true)}
                isLoading={isLoading}
                onRefresh={() => refetch()}
              />
            </div>

            <div className="flex-1 h-full overflow-hidden">
              {selectedThread ? (
                <ChatPane
                  thread={selectedThread}
                  messages={messages}
                  onSendReply={handleSendReply}
                  onArchive={(id) => setArchiveTargetThreadId(id)}
                  onDelete={(id) => setDeleteTargetThreadId(id)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-panel border border-border/40 rounded-card p-8 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-panel-strong/60 flex items-center justify-center text-text-muted mb-3 border border-border/30">
                    <Mail size={24} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-text">No Conversation Selected</h3>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </TabContainer>
  );
};
