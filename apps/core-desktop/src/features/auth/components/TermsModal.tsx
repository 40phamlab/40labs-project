import * as React from 'react';
import { Modal, Button, Checkbox } from '@40labs/ui-components';

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
          <h3 className="font-semibold">1. Masharti ya Huduma ya 40Labs</h3>
          <p>
            Kwa kutumia mfumo huu wa 40Labs, unakubali masharti yote ya huduma, sera ya faragha, na sheria za usalama wa data za Jamhuri ya Muungano wa Tanzania.
          </p>
          <h3 className="font-semibold">2. Faragha na Usalama wa Data</h3>
          <p>
            Data zote za wagonjwa, hesabu, na biashara zinalindwa kwa viwango vya juu vya usalama wa ndani (offline-first).
          </p>
          <h3 className="font-semibold">3. Wajibu wa Mtumiaji</h3>
          <p>
            Kila mtumiaji ana wajibu wa kulinda nenosiri na namba yake ya siri (PIN). Vitendo vyote vilivyofanywa chini ya kikao chako ni jukumu lako.
          </p>
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
          <Button variant="outline" onClick={onClose}>
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
