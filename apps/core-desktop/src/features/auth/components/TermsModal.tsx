import * as React from 'react';
import { Modal, Button, Checkbox } from '@40labs/ui-components';
import { TERMS_SECTIONS } from './termsContent';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  const [scrolledToBottom, setScrolledToBottom] = React.useState(false);
  const [accepted, setAccepted] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setScrolledToBottom(true);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Masharti na Vigezo">
      <div className="space-y-4">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-64 overflow-y-auto p-4 border border-border rounded-lg text-sm bg-background text-foreground space-y-3"
        >
          {TERMS_SECTIONS.map(({ title, body }) => (
            <React.Fragment key={title}>
              <h3 className="font-semibold">{title}</h3>
              <p>{body}</p>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            checked={accepted}
            disabled={!scrolledToBottom}
            onChange={(e: any) => setAccepted(e.target?.checked ?? !accepted)}
            label="Ninakubali masharti na sera ya faragha"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button intent="neutral" onClick={onClose}>
            Ghairi
          </Button>
          <Button disabled={!scrolledToBottom || !accepted} onClick={onAccept}>
            Kubali
          </Button>
        </div>
      </div>
    </Modal>
  );
};
