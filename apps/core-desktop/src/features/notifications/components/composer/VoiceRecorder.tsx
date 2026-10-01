import * as React from 'react';
import { Trash2, Send } from 'lucide-react';
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
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [micError, setMicError] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const timerRef = React.useRef<any>(null);

  const stopAllTracks = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    startRecording();
    return () => {
      stopAllTracks();
    };
  }, []);

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicError('Microphone not supported on this platform.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const buffer = await audioBlob.arrayBuffer();
        const bytes = Array.from(new Uint8Array(buffer));

        try {
          const saved = await notificationsApi.saveAttachment({
            messageId,
            kind: 'audio',
            fileName: `voice_note_${Date.now()}.webm`,
            mimeType: mimeType,
            bytes,
          });
          onAudioRecorded(saved);
        } catch (err) {
          console.error('Failed to save voice note:', err);
          toast.error('Failed to save voice note');
        }
      };

      recorder.start();
      setIsRecording(true);
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission denied.');
      } else {
        setMicError('No microphone detected or error starting recording.');
      }
    }
  };

  const handleStopAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopAllTracks();
    }
  };

  const handleCancel = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    stopAllTracks();
    setIsRecording(false);
    onCancel();
  };

  if (micError) {
    return (
      <div className={`flex items-center justify-between gap-2 px-3 py-2 bg-danger/15 border border-danger/30 rounded-card text-xs text-danger ${className}`}>
        <span>{micError}</span>
        <button type="button" onClick={onCancel} className="font-bold underline">Dismiss</button>
      </div>
    );
  }

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeDisplay = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div className={`flex items-center gap-3 px-3 py-2 bg-panel-strong/60 border border-border/40 rounded-full shadow-xs ${className}`}>
      <div className="flex items-center gap-2 text-xs font-mono text-danger animate-pulse">
        <div className="w-2.5 h-2.5 rounded-full bg-danger" />
        <span>{timeDisplay}</span>
      </div>

      <div className="flex-1 flex items-center gap-1 text-xs text-text-muted">
        <span>Recording voice note...</span>
      </div>

      <div className="flex items-center gap-1">
        <IconButton
          icon={<Trash2 size={15} className="text-text-muted hover:text-danger" />}
          label="Cancel recording"
          intent="ghost"
          size="sm"
          onClick={handleCancel}
        />
        <IconButton
          icon={<Send size={15} className="text-white" />}
          label="Stop and send"
          intent="primary"
          size="md"
          onClick={handleStopAndSend}
          className="rounded-full w-8 h-8 bg-primary hover:bg-primary-hover flex items-center justify-center"
        />
      </div>
    </div>
  );
};
