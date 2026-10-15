import * as React from 'react';
import { ConfirmDialog } from '@40labs/ui-components';
import type { MessageChannel } from '@40labs/types';
import { TabContainer } from '../../components/TabContainer';
import { ThreadList } from './components/ThreadList';
import { ChatPane } from './components/ChatPane';
import { NotificationsOverviewPanel } from './components/NotificationsOverviewPanel';
import { NewConversationModal, ContactOption } from './components/NewConversationModal';
import { useThreads, useThreadMessages, useSendThreadMessage, useMarkThreadRead, useArchiveThread, useFindOrCreateThread, useNotifications } from '../../hooks/useNotifications';
import { useToast } from '../../hooks/useToast';

export const NotificationsScreen: React.FC = () => {
  const { threads, isLoading, refetch } = useThreads(false);
  const { notifications } = useNotifications();
  const [selectedThreadId, setSelectedThreadId] = React.useState<string | null>(null);

  const selectedThread = React.useMemo(() => {
    if (!selectedThreadId) return null;
    return threads.find((t) => t.id === selectedThreadId) || null;
  }, [threads, selectedThreadId]);

  const { messages, refetch: refetchMessages } = useThreadMessages(selectedThreadId);
  const { sendMessage } = useSendThreadMessage();
  const { markThreadRead } = useMarkThreadRead();
  const { archiveThread } = useArchiveThread();
  const { findOrCreateThread } = useFindOrCreateThread();
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
      await markThreadRead(threadId);
      refetchMessages();
    },
    [markThreadRead, refetchMessages]
  );

  const handleConfirmArchive = React.useCallback(async () => {
    if (archiveTargetThreadId) {
      await archiveThread(archiveTargetThreadId);
      if (selectedThreadId === archiveTargetThreadId) {
        setSelectedThreadId(null);
      }
      refetch();
    }
    setArchiveTargetThreadId(null);
  }, [archiveTargetThreadId, archiveThread, selectedThreadId, refetch]);

  const handleConfirmDelete = React.useCallback(async () => {
    if (deleteTargetThreadId) {
      await archiveThread(deleteTargetThreadId);
      if (selectedThreadId === deleteTargetThreadId) {
        setSelectedThreadId(null);
      }
      refetch();
    }
    setDeleteTargetThreadId(null);
  }, [deleteTargetThreadId, archiveThread, selectedThreadId, refetch]);

  const handleSendReply = React.useCallback(
    async (replyText: string, attachmentIds: string[] = []) => {
      if (!selectedThreadId) return;
      try {
        await sendMessage({
          threadId: selectedThreadId,
          direction: 'outgoing',
          body: replyText,
          attachmentIds,
        });
        refetchMessages();
      } catch (err) {
        console.error('Failed to send message:', err);
        toast.error('Message was not sent.');
        throw err;
      }
    },
    [selectedThreadId, sendMessage, refetchMessages, toast]
  );

  const handleStartNewConversation = React.useCallback(
    async (contacts: ContactOption[], _channel: MessageChannel) => {
      let firstId: string | null = null;
      let createdCount = 0;
      for (const contact of contacts) {
        const thread = await findOrCreateThread({
          counterpartyType: 'customer',
          counterpartyKey: `customer:${contact.id}`,
          counterpartyId: contact.id,
          displayName: contact.name,
        });
        if (!firstId) firstId = thread.id;
        createdCount++;
      }
      if (firstId) {
        setSelectedThreadId(firstId);
      }
      refetch();
      return { failedContactIds: [], createdCount };
    },
    [findOrCreateThread, refetch]
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
              <div className="w-full h-full rounded-card elevation-raised bg-panel border border-border/50 overflow-hidden">
                <ChatPane
                  thread={selectedThread}
                  messages={messages}
                  onSendReply={handleSendReply}
                  onArchive={(id) => setArchiveTargetThreadId(id)}
                  onDelete={(id) => setDeleteTargetThreadId(id)}
                />
              </div>
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
                className="w-full h-full"
              />
            )}
          </div>
        ) : (
          <>
            <ThreadList
              threads={threads}
              selectedId={selectedThreadId}
              onSelectThread={handleSelectThread}
              onArchiveThread={(id) => setArchiveTargetThreadId(id)}
              onDeleteThread={(id) => setDeleteTargetThreadId(id)}
              onNewConversation={() => setIsNewConversationOpen(true)}
              isLoading={isLoading}
              onRefresh={() => refetch()}
              className="w-80 shrink-0 h-full"
            />

            <div className="flex-1 h-full min-h-0 rounded-card elevation-raised bg-panel border border-border/50 overflow-hidden">
              {selectedThread ? (
                <ChatPane
                  thread={selectedThread}
                  messages={messages}
                  onSendReply={handleSendReply}
                  onArchive={(id) => setArchiveTargetThreadId(id)}
                  onDelete={(id) => setDeleteTargetThreadId(id)}
                />
              ) : (
                <div className="w-full h-full flex flex-col p-6 overflow-y-auto">
                  <NotificationsOverviewPanel notifications={notifications} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </TabContainer>
  );
};
