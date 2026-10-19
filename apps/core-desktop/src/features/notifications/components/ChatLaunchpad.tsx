import * as React from 'react';
import { Search, PlusCircle, Paperclip } from 'lucide-react';
import { t, Language } from '@40labs/i18n';

export interface ChatLaunchpadProps {
  onSearchCustomer: () => void;
  onNewChat: () => void;
  onAttachMedia: () => void;
  lang?: Language;
  className?: string;
}

export const ChatLaunchpad: React.FC<ChatLaunchpadProps> = ({
  onSearchCustomer,
  onNewChat,
  onAttachMedia,
  lang = 'sw-TZ',
  className = '',
}) => {
  const actions = [
    {
      id: 'search',
      title: t('notifications.launchpad.searchCustomer', lang),
      icon: <Search size={28} className="text-[#16A34A]" />,
      kbd: 'Ctrl+K',
      onClick: onSearchCustomer,
    },
    {
      id: 'new',
      title: t('notifications.launchpad.newChat', lang),
      icon: <PlusCircle size={28} className="text-[#16A34A]" />,
      kbd: 'Ctrl+N',
      onClick: onNewChat,
    },
    {
      id: 'attach',
      title: t('notifications.launchpad.attachMedia', lang),
      icon: <Paperclip size={28} className="text-[#16A34A]" />,
      kbd: 'Ctrl+U',
      onClick: onAttachMedia,
    },
  ];

  return (
    <div className={`flex flex-col items-center justify-center flex-1 w-full p-8 ${className}`}>
      <div className="flex flex-col md:flex-row items-center justify-center gap-16 w-full max-w-4xl">
        {actions.map((act) => (
          <button
            key={act.id}
            type="button"
            onClick={act.onClick}
            className="
              flex flex-col items-center justify-center gap-2 group cursor-pointer bg-transparent border-none p-6 min-w-[120px] min-h-[120px]
              outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-xl
            "
          >
            <div className="flex items-center justify-center transition-transform duration-150 group-hover:scale-108">
              {act.icon}
            </div>
            <span className="text-sm font-semibold text-text group-hover:text-[#16A34A] transition-colors font-sora">
              {act.title}
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              {act.kbd}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
