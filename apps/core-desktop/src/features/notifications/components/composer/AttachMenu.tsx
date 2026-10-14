import * as React from 'react';
import { FileText, Image as ImageIcon, Camera, Mic, Users, X } from 'lucide-react';
import { isTauriAvailable } from '../../../../api/client';
import { notificationsApi } from '../../../../api/notificationsApi';
import { useToast } from '../../../../hooks/useToast';

export interface AttachMenuProps {
  messageId: string;
  onAttachSaved: (att: any) => void;
  onClose: () => void;
  className?: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const AttachMenu: React.FC<AttachMenuProps> = ({
  messageId,
  onAttachSaved,
  onClose,
  className = '',
}) => {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [hasCamera, setHasCamera] = React.useState(false);
  const [showCameraModal, setShowCameraModal] = React.useState(false);
  const [showContactModal, setShowContactModal] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const mimeForName = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const known: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      txt: 'text/plain',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      ogg: 'audio/ogg',
      webm: 'audio/webm',
    };
    return ext ? known[ext] || 'application/octet-stream' : 'application/octet-stream';
  };

  React.useEffect(() => {
    let active = true;
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        if (!active) return;
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasCamera(videoDevices.length > 0);
      }).catch(() => {
        if (active) setHasCamera(true);
      });
    } else if (navigator.mediaDevices) {
      setHasCamera(true);
    }
    return () => {
      active = false;
    };
  }, []);

  const handleFileSelect = async (kind: 'image' | 'file' | 'audio') => {
    try {
      if (isTauriAvailable()) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          multiple: true,
          filters: kind === 'image'
            ? [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }]
            : kind === 'audio'
            ? [{ name: 'Audio', extensions: ['mp3', 'wav', 'm4a', 'ogg', 'webm'] }]
            : [{ name: 'Documents', extensions: ['pdf', 'txt', 'docx', 'xlsx', 'csv', 'md'] }]
        });

        if (selected) {
          const paths = Array.isArray(selected) ? selected : [selected];
          const failed: string[] = [];
          const successful: string[] = [];
          for (const filePath of paths) {
            const fileName = filePath.split(/[\\/]/).pop() || 'file';
            const mimeType = mimeForName(fileName);
            try {
              const saved = await notificationsApi.saveAttachment({ messageId, kind, fileName, mimeType, sourcePath: filePath });
              onAttachSaved(saved);
              successful.push(fileName);
            } catch (err: any) {
              console.error('Save attachment error:', err);
              failed.push(fileName);
              toast.error(err?.message || `Failed to attach ${fileName}`);
            }
          }
        }
      } else {
        fileInputRef.current?.click();
        return;
      }
    } catch (err) {
      console.error('Attach error:', err);
      toast.error('File selection failed.');
    }
    onClose();
  };

  const handleBrowserFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" exceeds 25 MB limit.`);
        continue;
      }

      const buffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));
      const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file';

      try {
        const saved = await notificationsApi.saveAttachment({
          messageId,
          kind,
          fileName: file.name,
          mimeType: file.type || mimeForName(file.name),
          bytes,
        });
        onAttachSaved(saved);
      } catch (err: any) {
        console.error('Save attachment error:', err);
        toast.error(err?.message || `Failed to save ${file.name}`);
      }
    }
    e.target.value = '';
    onClose();
  };

  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      toast.error('Camera permission denied or unavailable.');
      setShowCameraModal(false);
    }
  };

  const captureCameraFrame = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const buffer = await blob.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));
      try {
        const saved = await notificationsApi.saveAttachment({
          messageId,
          kind: 'image',
          fileName: `capture_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          bytes,
        });
        onAttachSaved(saved);
      } catch (err) {
        toast.error('Failed to save captured photo.');
      }
      stopCamera();
      onClose();
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setShowCameraModal(false);
  };

  return (
    <>
      <div className={`absolute bottom-full left-0 mb-2 w-52 bg-panel border border-border/40 rounded-card shadow-xl py-1.5 z-50 flex flex-col ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleBrowserFileChange}
        />
        <button
          type="button"
          onClick={() => handleFileSelect('file')}
          className="px-3.5 py-2 text-xs text-left hover:bg-panel-strong flex items-center gap-2.5 transition-colors text-text"
        >
          <FileText size={16} className="text-primary" /> Document
        </button>
        <button
          type="button"
          onClick={() => handleFileSelect('image')}
          className="px-3.5 py-2 text-xs text-left hover:bg-panel-strong flex items-center gap-2.5 transition-colors text-text"
        >
          <ImageIcon size={16} className="text-accent" /> Photos & Videos
        </button>
        {hasCamera && (
          <button
            type="button"
            onClick={startCamera}
            className="px-3.5 py-2 text-xs text-left hover:bg-panel-strong flex items-center gap-2.5 transition-colors text-text"
          >
            <Camera size={16} className="text-warning" /> Camera
          </button>
        )}
        <button
          type="button"
          onClick={() => handleFileSelect('audio')}
          className="px-3.5 py-2 text-xs text-left hover:bg-panel-strong flex items-center gap-2.5 transition-colors text-text"
        >
          <Mic size={16} className="text-success" /> Audio
        </button>
        <button
          type="button"
          onClick={() => {
            setShowContactModal(true);
          }}
          className="px-3.5 py-2 text-xs text-left hover:bg-panel-strong flex items-center gap-2.5 transition-colors text-text border-t border-border/20 mt-1"
        >
          <Users size={16} className="text-primary" /> Contact Card
        </button>
      </div>

      {showCameraModal && (
        <div role="dialog" aria-modal="true" aria-label="Camera Capture" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-panel rounded-card border border-border p-4 flex flex-col items-center gap-4 max-w-lg w-full">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-sm font-bold text-text">Take Photo</h3>
              <button type="button" onClick={stopCamera} className="text-text-muted hover:text-text">
                <X size={18} />
              </button>
            </div>
            <video ref={videoRef} autoPlay playsInline className="w-full h-72 rounded bg-black object-cover" />
            <button
              type="button"
              onClick={captureCameraFrame}
              className="px-4 py-2 bg-primary text-white rounded text-xs font-bold hover:opacity-90"
            >
              Capture & Attach
            </button>
          </div>
        </div>
      )}

      {showContactModal && (
        <div role="dialog" aria-modal="true" aria-label="Select Contact" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-panel rounded-card border border-border p-5 flex flex-col gap-4 max-w-md w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text">Select Contact to Send</h3>
              <button type="button" onClick={() => setShowContactModal(false)} className="text-text-muted hover:text-text">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const textEncoder = new TextEncoder();
                    const cardContent = JSON.stringify({ type: 'contact', name: 'Dr. John Doe', role: 'Customer', phone: '+255700000000' });
                    const bytes = Array.from(textEncoder.encode(cardContent));
                    const saved = await notificationsApi.saveAttachment({
                      messageId,
                      kind: 'file',
                      fileName: 'contact_Dr_John_Doe.vcf',
                      mimeType: 'text/vcard',
                      bytes,
                    });
                    onAttachSaved(saved);
                  } catch (e) {
                    toast.error('Failed to attach contact.');
                  }
                  setShowContactModal(false);
                  onClose();
                }}
                className="p-2.5 rounded bg-panel-strong text-left hover:bg-surface-hover text-xs flex flex-col gap-0.5"
              >
                <span className="font-bold text-text">Dr. John Doe (Customer)</span>
                <span className="text-[10px] text-text-muted">+255 700 000 000</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const textEncoder = new TextEncoder();
                    const cardContent = JSON.stringify({ type: 'contact', name: 'Afya Pharma Supplier', role: 'Supplier', phone: '+255711111111' });
                    const bytes = Array.from(textEncoder.encode(cardContent));
                    const saved = await notificationsApi.saveAttachment({
                      messageId,
                      kind: 'file',
                      fileName: 'contact_Afya_Supplier.vcf',
                      mimeType: 'text/vcard',
                      bytes,
                    });
                    onAttachSaved(saved);
                  } catch (e) {
                    toast.error('Failed to attach contact.');
                  }
                  setShowContactModal(false);
                  onClose();
                }}
                className="p-2.5 rounded bg-panel-strong text-left hover:bg-surface-hover text-xs flex flex-col gap-0.5"
              >
                <span className="font-bold text-text">Afya Pharma Supplier</span>
                <span className="text-[10px] text-text-muted">+255 711 111 111</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
