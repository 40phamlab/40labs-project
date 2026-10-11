import * as React from 'react';
import { Modal } from '../../overlays/Modal';
import { FilePreview, FilePreviewProps } from './FilePreview';

export interface FilePreviewModalProps extends FilePreviewProps {
  isOpen: boolean;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  ...props
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose?.()}
      size="xl"
      className="p-0 overflow-hidden bg-transparent border-0 shadow-none max-w-5xl"
    >
      <div className="w-full h-[80vh] flex flex-col">
        <FilePreview {...props} onClose={onClose} variant="modal" />
      </div>
    </Modal>
  );
};
