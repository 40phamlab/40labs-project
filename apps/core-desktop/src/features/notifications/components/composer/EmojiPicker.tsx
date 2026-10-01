import * as React from 'react';

export interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '💊', '🩺', '🩹', '💉', '🧪', '🔬', '🧬', '🦷', '🦴', '👁️',
  '⭐', '🌟', '✨', '⚡', '🔥', '💥', '💯', '💬', '📢', '🔔'
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose, className = '' }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute bottom-full left-0 mb-2 w-64 bg-panel border border-border/40 rounded-card shadow-xl p-3 z-50 flex flex-col gap-2 ${className}`}
    >
      <div className="text-[11px] font-bold text-text-muted uppercase">Select Emoji</div>
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center text-base rounded hover:bg-panel-strong transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
