import * as React from 'react';
import {
  Copy,
  Scissors,
  Clipboard,
  CheckSquare,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Home,
  Settings,
  Languages,
  SunMoon,
  Cloud,
  MessageSquare,
  Eye,
  Archive,
  CheckCircle2,
  Reply,
  Trash2
} from 'lucide-react';
import { t } from '@40labs/i18n';
import { useNavStore } from '../../stores/useNavStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore } from '../../stores/useLanguageStore';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  requiresPin?: boolean;
  onSelect: () => void | Promise<void>;
  dividerAfter?: boolean;
}

interface ResolveItemsOptions {
  targetType: 'global' | 'text' | 'editable' | 'chat' | 'message' | 'row';
  targetId?: string;
  selectedText?: string;
  meta?: Record<string, unknown>;
  onRefreshData?: () => void;
  onPinStepUp?: (actionId: string, callback: () => void) => void;
}

export function resolveMenuItems(options: ResolveItemsOptions): ContextMenuItem[] {
  const { targetType, selectedText, onRefreshData, onPinStepUp } = options;
  const setActiveScreen = useNavStore.getState().setActiveScreen;
  const { theme, setTheme } = useThemeStore.getState();
  const { language, setLanguage } = useLanguageStore.getState();

  const items: ContextMenuItem[] = [];

  if (targetType === 'text') {
    items.push({
      id: 'copy',
      label: t('contextMenu.copy'),
      icon: React.createElement(Copy, { size: 16 }),
      shortcut: 'Ctrl+C',
      onSelect: () => {
        if (selectedText) {
          navigator.clipboard.writeText(selectedText);
        } else {
          document.execCommand('copy');
        }
      },
    });
    items.push({
      id: 'selectAll',
      label: t('contextMenu.selectAll'),
      icon: React.createElement(CheckSquare, { size: 16 }),
      shortcut: 'Ctrl+A',
      onSelect: () => {
        document.execCommand('selectAll');
      },
    });
    return items;
  }

  if (targetType === 'editable') {
    items.push({
      id: 'cut',
      label: t('contextMenu.cut'),
      icon: React.createElement(Scissors, { size: 16 }),
      shortcut: 'Ctrl+X',
      onSelect: () => {
        document.execCommand('cut');
      },
    });
    items.push({
      id: 'copy',
      label: t('contextMenu.copy'),
      icon: React.createElement(Copy, { size: 16 }),
      shortcut: 'Ctrl+C',
      onSelect: () => {
        document.execCommand('copy');
      },
    });
    items.push({
      id: 'paste',
      label: t('contextMenu.paste'),
      icon: React.createElement(Clipboard, { size: 16 }),
      shortcut: 'Ctrl+V',
      onSelect: async () => {
        try {
          const text = await navigator.clipboard.readText();
          document.execCommand('insertText', false, text);
        } catch {
          document.execCommand('paste');
        }
      },
      dividerAfter: true,
    });
    items.push({
      id: 'selectAll',
      label: t('contextMenu.selectAll'),
      icon: React.createElement(CheckSquare, { size: 16 }),
      shortcut: 'Ctrl+A',
      onSelect: () => {
        document.execCommand('selectAll');
      },
    });
    items.push({
      id: 'undo',
      label: t('contextMenu.undo'),
      icon: React.createElement(RotateCcw, { size: 16 }),
      shortcut: 'Ctrl+Z',
      onSelect: () => {
        document.execCommand('undo');
      },
    });
    items.push({
      id: 'redo',
      label: t('contextMenu.redo'),
      icon: React.createElement(RotateCw, { size: 16 }),
      shortcut: 'Ctrl+Y',
      onSelect: () => {
        document.execCommand('redo');
      },
    });
    return items;
  }

  if (targetType === 'chat') {
    items.push({
      id: 'openChat',
      label: t('contextMenu.openChat'),
      icon: React.createElement(MessageSquare, { size: 16 }),
      onSelect: () => {
        setActiveScreen('notifications');
      },
    });
    items.push({
      id: 'markRead',
      label: t('contextMenu.markAsRead'),
      icon: React.createElement(CheckCircle2, { size: 16 }),
      onSelect: () => {
        // Handled or dispatched via event/store if needed
      },
    });
    items.push({
      id: 'archive',
      label: t('contextMenu.archive'),
      icon: React.createElement(Archive, { size: 16 }),
      onSelect: () => {
        // Archive action
      },
    });
    items.push({
      id: 'profile',
      label: t('contextMenu.viewProfile'),
      icon: React.createElement(Eye, { size: 16 }),
      onSelect: () => {
        setActiveScreen('customers');
      },
    });
    return items;
  }

  if (targetType === 'message') {
    items.push({
      id: 'copyText',
      label: t('contextMenu.copy'),
      icon: React.createElement(Copy, { size: 16 }),
      onSelect: () => {
        const text = (options.meta?.['messageBody'] as string) || '';
        if (text) navigator.clipboard.writeText(text);
      },
    });
    items.push({
      id: 'reply',
      label: t('contextMenu.reply'),
      icon: React.createElement(Reply, { size: 16 }),
      onSelect: () => {
        setActiveScreen('notifications');
      },
      dividerAfter: true,
    });
    items.push({
      id: 'deleteMessage',
      label: t('contextMenu.deleteMessage'),
      icon: React.createElement(Trash2, { size: 16 }),
      danger: true,
      requiresPin: true,
      onSelect: () => {
        const doDelete = () => {
          // Execute message deletion
        };
        if (onPinStepUp) {
          onPinStepUp('delete_message', doDelete);
        } else {
          doDelete();
        }
      },
    });
    return items;
  }

  // Global / default area
  items.push({
    id: 'refreshData',
    label: t('contextMenu.refreshData'),
    icon: React.createElement(RefreshCw, { size: 16 }),
    shortcut: 'Ctrl+R',
    onSelect: () => {
      if (onRefreshData) onRefreshData();
    },
  });
  items.push({
    id: 'goToHome',
    label: t('contextMenu.goToHome'),
    icon: React.createElement(Home, { size: 16 }),
    onSelect: () => {
      setActiveScreen('dashboard');
    },
    dividerAfter: true,
  });
  items.push({
    id: 'settings',
    label: t('contextMenu.settings'),
    icon: React.createElement(Settings, { size: 16 }),
    shortcut: 'Ctrl+,',
    onSelect: () => {
      setActiveScreen('settings');
    },
  });
  items.push({
    id: 'switchLang',
    label: t('contextMenu.switchLanguage'),
    icon: React.createElement(Languages, { size: 16 }),
    onSelect: () => {
      const nextLang = language === 'sw' ? 'en' : 'sw';
      setLanguage(nextLang);
    },
  });
  items.push({
    id: 'toggleTheme',
    label: t('contextMenu.toggleTheme'),
    icon: React.createElement(SunMoon, { size: 16 }),
    onSelect: () => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    },
    dividerAfter: true,
  });
  items.push({
    id: 'syncStatus',
    label: t('contextMenu.syncStatus'),
    icon: React.createElement(Cloud, { size: 16 }),
    disabled: true,
    onSelect: () => {},
  });

  return items;
}
