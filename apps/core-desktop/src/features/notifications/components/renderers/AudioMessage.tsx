import * as React from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { IconButton } from '@40labs/ui-components';

export interface AudioMessageProps {
  name?: string;
  size?: string;
  className?: string;
}

export const AudioMessage: React.FC<AudioMessageProps> = ({
  name = 'Voice message',
  size = '0:28',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 5;
        });
      }, 300);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div className={`flex items-center gap-3 p-3 bg-panel-strong/40 border border-border/30 rounded-card max-w-xs shadow-2xs ${className}`}>
      <IconButton
        icon={isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
        label={isPlaying ? 'Pause audio' : 'Play audio'}
        intent="primary"
        size="sm"
        onClick={() => setIsPlaying(!isPlaying)}
        className="rounded-full w-9 h-9 bg-primary hover:bg-primary-hover flex items-center justify-center shrink-0"
      />

      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-text">
          <span className="flex items-center gap-1.5 truncate">
            <Mic size={13} className="text-accent" />
            <span className="truncate">{name}</span>
          </span>
          <span className="text-[10px] text-text-muted font-mono">{size}</span>
        </div>

        {/* Progress Bar Waveform simulation */}
        <div className="w-full h-1.5 bg-panel-strong/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
