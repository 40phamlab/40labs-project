import * as React from 'react';

export interface ComposerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  className?: string;
}

export const ComposerInput: React.FC<ComposerInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = 'Type a message...',
  className = '',
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const newHeight = Math.min(ta.scrollHeight, 144);
    ta.style.height = `${newHeight}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={1}
      className={`flex-1 text-xs resize-none border-0 bg-transparent py-1 px-1 focus:ring-0 shadow-none leading-[24px] text-text placeholder:text-text-muted outline-none ${className}`}
    />
  );
};
