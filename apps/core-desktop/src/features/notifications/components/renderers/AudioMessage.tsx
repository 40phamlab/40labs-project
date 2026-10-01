import * as React from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { IconButton } from '@40labs/ui-components';

export interface AudioMessageProps {
  name?: string;
  size?: string;
  url?: string;
  durationMs?: number;
  className?: string;
}

export const AudioMessage: React.FC<AudioMessageProps> = ({
  name = 'Voice message',
  size: _size,
  url,
  durationMs,
  className = '',
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(durationMs ? durationMs / 1000 : 15);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`flex items-center gap-3 p-3 bg-panel-strong/40 border border-border/30 rounded-card max-w-xs shadow-2xs ${className}`}>
      {url && <audio ref={audioRef} src={url} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={() => setIsPlaying(false)} />}
      <IconButton
        icon={isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
        label={isPlaying ? 'Pause audio' : 'Play audio'}
        intent="primary"
        size="sm"
        onClick={togglePlay}
        className="rounded-full w-9 h-9 bg-primary hover:bg-primary-hover flex items-center justify-center shrink-0"
      />

      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center justify-between text-xs font-medium text-text">
          <span className="flex items-center gap-1.5 truncate">
            <Mic size={13} className="text-accent shrink-0" />
            <span className="truncate">{name}</span>
          </span>
          <span className="text-[10px] text-text-muted font-mono shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setCurrentTime(val);
            if (audioRef.current) audioRef.current.currentTime = val;
          }}
          className="w-full h-1.5 bg-panel-strong/80 rounded-full accent-primary cursor-pointer"
        />
      </div>
    </div>
  );
};
