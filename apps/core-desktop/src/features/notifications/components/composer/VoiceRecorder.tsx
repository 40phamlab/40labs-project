import * as React from 'react';
import { Trash2, Mic, Square, Paperclip } from 'lucide-react';
import { IconButton } from '@40labs/ui-components';
import { notificationsApi } from '../../../../api/notificationsApi';
import { useToast } from '../../../../hooks/useToast';

export interface VoiceRecorderProps {
  messageId: string;
  onAudioRecorded: (att: any) => void;
  onCancel: () => void;
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  messageId,
  onAudioRecorded,
  onCancel,
  className = '',
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [micError, setMicError] = React.useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState('');

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = React.useRef(false);

  const stopAllTracks = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  React.useEffect(() => {
    let active = true;
    const startRecording = async () => {
      cancelledRef.current = false;
      setMicError(null);
      audioChunksRef.current = [];
      try {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
          throw new Error('Microphone recording is not supported on this platform.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;

        const supportedType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
          .find((type) => MediaRecorder.isTypeSupported(type));
        const recorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : undefined);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        recorder.onerror = () => {
          setMicError('The microphone recording failed. Please try again.');
          stopAllTracks();
        };
        recorder.onstop = () => {
          stopAllTracks();
          if (cancelledRef.current) return;
          const mimeType = recorder.mimeType || supportedType || audioChunksRef.current[0]?.type || '';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          if (blob.size === 0) {
            setMicError('No audio was captured. Check your microphone and try again.');
            setIsProcessing(false);
            return;
          }
          setRecordedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          setIsProcessing(false);
        };

        recorder.start(250);
        setIsRecording(true);
        setIsProcessing(false);
        timerRef.current = setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
      } catch (error: any) {
        stopAllTracks();
        setIsProcessing(false);
        if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
          setMicError('Microphone permission denied. Allow microphone access and try again.');
        } else {
          setMicError(error?.message || 'No microphone detected or error starting recording.');
        }
      }
    };

    void startRecording();
    return () => {
      active = false;
      cancelledRef.current = true;
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      stopAllTracks();
    };
  }, [stopAllTracks]);

  React.useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const discardRecording = () => {
    cancelledRef.current = true;
    setPreviewUrl('');
    setRecordedBlob(null);
    onCancel();
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    setIsRecording(false);
    setIsProcessing(true);
    recorder.stop();
  };

  const attachRecording = async () => {
    if (!recordedBlob || isSaving) return;
    setIsSaving(true);
    try {
      const mimeType = recordedBlob.type.split(';')[0].trim().toLowerCase();
      const extension = mimeType === 'audio/mp4' ? 'm4a' : mimeType === 'audio/ogg' ? 'ogg' : 'webm';
      const bytes = Array.from(new Uint8Array(await recordedBlob.arrayBuffer()));
      const saved = await notificationsApi.saveAttachment({
        messageId,
        kind: 'audio',
        fileName: `voice_note_${Date.now()}.${extension}`,
        mimeType,
        bytes,
      });
      onAudioRecorded(saved);
    } catch (error) {
      console.error('Failed to save voice recording:', error);
      toast.error('Could not attach the recording. You can listen again or discard it.');
      setIsSaving(false);
    }
  };

  const timeDisplay = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  if (micError) {
    return (
      <div role="alert" className={`flex items-center justify-between gap-2 rounded-card border border-danger/30 bg-danger/15 px-3 py-2 text-xs text-danger ${className}`}>
        <span>{micError}</span>
        <button type="button" onClick={onCancel} className="font-bold underline">Dismiss</button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-card border border-border/50 bg-panel-strong/70 px-3 py-2 shadow-inner ${className}`}>
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 text-xs font-mono text-danger">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" />
            <span>{timeDisplay}</span>
          </div>
          <span className="min-w-0 flex-1 text-xs text-text-muted">Recording voice note…</span>
          <IconButton icon={<Trash2 size={15} />} label="Discard recording" intent="ghost" size="sm" onClick={discardRecording} />
          <IconButton icon={<Square size={14} />} label="Stop and preview recording" intent="primary" size="sm" onClick={stopRecording} />
        </>
      ) : isProcessing ? (
        <>
          <span className="min-w-0 flex-1 text-xs text-text-muted">Preparing recording for preview…</span>
          <IconButton icon={<Trash2 size={15} />} label="Cancel microphone request" intent="ghost" size="sm" onClick={discardRecording} />
        </>
      ) : recordedBlob && previewUrl ? (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-text"><Mic size={13} className="text-accent" /> Listen before attaching</span>
            <audio controls preload="metadata" src={previewUrl} className="h-9 w-full max-w-md" aria-label="Preview recorded voice note" />
          </div>
          <IconButton icon={<Trash2 size={15} />} label="Discard recording" intent="ghost" size="sm" onClick={discardRecording} />
          <IconButton icon={<Paperclip size={15} />} label={isSaving ? 'Attaching recording' : 'Attach recording'} intent="primary" size="sm" onClick={attachRecording} disabled={isSaving} />
        </>
      ) : null}
    </div>
  );
};
