import * as React from 'react';
import type { SampleEvent } from '@40labs/types';
import { formatDateTime } from '@40labs/i18n';
import { Clock, CheckCircle2 } from 'lucide-react';

interface TraceTimelineProps {
  events: SampleEvent[];
}

export const TraceTimeline: React.FC<TraceTimelineProps> = ({ events }) => {
  const sorted = React.useMemo(() => {
    return [...events].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
  }, [events]);

  if (sorted.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted text-sm">
        No chain of custody events recorded for this sample.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 w-full max-w-2xl">
      <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6">
        {sorted.map((ev) => (
          <div key={ev.id} className="relative flex flex-col gap-1">
            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-panel flex items-center justify-center">
              <CheckCircle2 size={10} className="text-white" />
            </span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-text uppercase font-mono">{ev.event_type.replace(/_/g, ' ')}</span>
              <span className="text-xs font-mono text-text-muted flex items-center gap-1">
                <Clock size={12} /> {formatDateTime(ev.occurred_at) || ev.occurred_at}
              </span>
            </div>
            <p className="text-xs text-text-muted font-mono">Actor: {ev.actor_user_id}</p>
            {ev.payload_json && (
              <pre className="mt-1 p-2 bg-panel-strong/40 rounded text-[11px] font-mono text-text overflow-x-auto">
                {ev.payload_json}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
