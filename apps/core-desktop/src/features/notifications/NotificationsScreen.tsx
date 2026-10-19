import * as React from 'react';
import { ConfirmDialog } from '@40labs/ui-components';
import type { MessageChannel, MessageAttachment } from '@40labs/types';
import { TabContainer } from '../../components/TabContainer';
import { ThreadList } from './components/ThreadList';
import { ChatPane } from './components/ChatPane';
import { CategoryStrip } from './components/CategoryStrip';
import { ChatLaunchpad } from './components/ChatLaunchpad';
import { ContactSearchPalette, SearchContact } from './components/ContactSearchPalette';
import { NewConversationModal, ContactOption } from './components/NewConversationModal';
import { useThreads, useThreadMessages, useSendThreadMessage, useMarkThreadRead, useArchiveThread, useFindOrCreateThread, useNotifications } from '../../hooks/useNotifications';
import { useToast } from '../../hooks/useToast';
import { isUsingTauriIpc } from '../../api/client';
import { notificationsApi } from '../../api/notificationsApi';

export const NotificationsScreen: React.FC = () => {
  const { threads, isLoading, refetch } = useThreads(false);
  const { activeCategory, setActiveCategory } = useNotifications();
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
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = React.useState(false);
  const [searchPaletteMode, setSearchPaletteMode] = React.useState<'search' | 'select_recipient'>('search');
  const [pendingAttachments, setPendingAttachments] = React.useState<MessageAttachment[]>([]);
  const [threadPendingAttachments, setThreadPendingAttachments] = React.useState<Map<string, MessageAttachment[]>>(new Map());
  const [isNarrowScreen, setIsNarrowScreen] = React.useState(false);

  const categoryCounts = React.useMemo(() => {
    let all = 0;
    let unread = 0;
    let customers = 0;
    let business = 0;
    let gov = 0;
    let marketing = 0;

    let unreadBusiness = false;
    let unreadGov = false;
    let unreadCustomers = false;
    let unreadMarketing = false;
    let unreadAll = false;

    for (const t of threads) {
      if (t.archived) continue;
      all++;
      const hasUnread = t.unread_count > 0;
      if (hasUnread) {
        unread++;
        unreadAll = true;
      }
      if (t.counterparty_type === 'customer') {
        customers++;
        if (hasUnread) unreadCustomers = true;
      } else if (t.counterparty_type === 'business') {
        business++;
        if (hasUnread) unreadBusiness = true;
      } else if (t.counterparty_type === 'gov') {
        gov++;
        if (hasUnread) unreadGov = true;
      } else if (t.counterparty_type === 'marketing' || t.counterparty_type === 'system') {
        marketing++;
        if (hasUnread) unreadMarketing = true;
      }
    }

    return {
      counts: { business, unread, gov, customers, marketing, all },
      unreadFlags: {
        business: unreadBusiness,
        unread: false,
        gov: unreadGov,
        customers: unreadCustomers,
        marketing: unreadMarketing,
        all: unreadAll,
      },
    };
  }, [threads]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsNarrowScreen(window.innerWidth < 900);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts: Ctrl+K (search), Ctrl+N (new chat), Ctrl+U (attach media)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchPaletteMode('search');
        setIsSearchPaletteOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsNewConversationOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        void handleAttachMediaFlow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAttachMediaFlow = async () => {
    try {
      if (isUsingTauriIpc()) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          multiple: true,
          filters: [
            { name: 'Media & Files', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'txt', 'docx', 'xlsx', 'csv', 'md', 'mp3', 'wav', 'm4a', 'ogg', 'webm'] }
          ]
        });
        if (selected) {
          const paths = Array.isArray(selected) ? selected : [selected];
          const savedAtts: MessageAttachment[] = [];
          for (const filePath of paths) {
            const fileName = filePath.split(/[\\/]/).pop() || 'file';
            const ext = fileName.split('.').pop()?.toLowerCase();
            const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream';
            const kind = mimeType.startsWith('image/') ? 'image' : 'file';
            const saved = await notificationsApi.saveAttachment({ messageId: 'temp', kind, fileName, mimeType, sourcePath: filePath });
            savedAtts.push(saved);
          }
          if (savedAtts.length > 0) {
            setPendingAttachments(savedAtts);
            setSearchPaletteMode('select_recipient');
            setIsSearchPaletteOpen(true);
          }
        }
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = async (ev) => {
          const files = (ev.target as HTMLInputElement).files;
          if (!files || files.length === 0) return;
          const savedAtts: MessageAttachment[] = [];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const buffer = await file.arrayBuffer();
            const kind = file.type.startsWith('image/') ? 'image' : 'file';
            const saved = await notificationsApi.saveAttachment({
              messageId: 'temp',
              kind,
              fileName: file.name,
              mimeType: file.type || 'application/octet-stream',
              bytes: Array.from(new Uint8Array(buffer)),
            });
            savedAtts.push(saved);
          }
          if (savedAtts.length > 0) {
            setPendingAttachments(savedAtts);
            setSearchPaletteMode('select_recipient');
            setIsSearchPaletteOpen(true);
          }
        };
        input.click();
      }
    } catch (err) {
      console.error('Attach flow error:', err);
      toast.error('Failed to select files for attachment.');
    }
  };

  const handleSelectContactFromPalette = async (contact: SearchContact) => {
    const thread = await findOrCreateThread({
      counterpartyType: contact.counterpartyType,
      counterpartyKey: contact.counterpartyKey,
      counterpartyId: contact.id,
      displayName: contact.name,
    });
    setSelectedThreadId(thread.id);
    if (pendingAttachments.length > 0) {
      setThreadPendingAttachments((prev) => new Map(prev).set(thread.id, [...pendingAttachments]));
      setPendingAttachments([]);
    }
    refetch();
  };

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

          <ContactSearchPalette
            isOpen={isSearchPaletteOpen}
            onClose={() => {
              setIsSearchPaletteOpen(false);
              setPendingAttachments([]);
            }}
            onSelectContact={handleSelectContactFromPalette}
            title={searchPaletteMode === 'select_recipient' ? 'Select recipient for attachment' : undefined}
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
              <div className="w-full h-full bg-tab-panel rounded-card elevation-tab-panel border border-border/50 overflow-hidden flex flex-col">
                <ChatPane
                  thread={selectedThread}
                  messages={messages}
                  onSendReply={handleSendReply}
                  onArchive={(id) => setArchiveTargetThreadId(id)}
                  onDelete={(id) => setDeleteTargetThreadId(id)}
                  initialAttachments={selectedThreadId ? threadPendingAttachments.get(selectedThreadId) : undefined}
                  onClearInitialAttachments={() => {
                    if (selectedThreadId) {
                      setThreadPendingAttachments((prev) => {
                        const next = new Map(prev);
                        next.delete(selectedThreadId);
                        return next;
                      });
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col bg-tab-panel rounded-card border border-border/50 overflow-hidden">
                <div className="flex-1 min-h-0 relative flex flex-col">
                  <ChatLaunchpad
                    onSearchCustomer={() => {
                      setSearchPaletteMode('search');
                      setIsSearchPaletteOpen(true);
                    }}
                    onNewChat={() => setIsNewConversationOpen(true)}
                    onAttachMedia={() => void handleAttachMediaFlow()}
                  />
                </div>
                <CategoryStrip
                  counts={categoryCounts.counts}
                  unreadFlags={categoryCounts.unreadFlags}
                  activeCategory={activeCategory}
                  onSelectCategory={setActiveCategory}
                />
              </div>
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

            <div className="flex-1 h-full min-h-0 bg-tab-panel rounded-card elevation-tab-panel border border-border/50 overflow-hidden flex flex-col">
              {selectedThread ? (
                <ChatPane
                  thread={selectedThread}
                  messages={messages}
                  onSendReply={handleSendReply}
                  onArchive={(id) => setArchiveTargetThreadId(id)}
                  onDelete={(id) => setDeleteTargetThreadId(id)}
                  initialAttachments={selectedThreadId ? threadPendingAttachments.get(selectedThreadId) : undefined}
                  onClearInitialAttachments={() => {
                    if (selectedThreadId) {
                      setThreadPendingAttachments((prev) => {
                        const next = new Map(prev);
                        next.delete(selectedThreadId);
                        return next;
                      });
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col relative overflow-hidden">
                  <ChatLaunchpad
                    onSearchCustomer={() => {
                      setSearchPaletteMode('search');
                      setIsSearchPaletteOpen(true);
                    }}
                    onNewChat={() => setIsNewConversationOpen(true)}
                    onAttachMedia={() => void handleAttachMediaFlow()}
                  />
                  <CategoryStrip
                    counts={categoryCounts.counts}
                    unreadFlags={categoryCounts.unreadFlags}
                    activeCategory={activeCategory}
                    onSelectCategory={setActiveCategory}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </TabContainer>
  );
};
