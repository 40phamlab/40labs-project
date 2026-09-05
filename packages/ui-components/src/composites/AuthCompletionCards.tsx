import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardBody, Button } from '../index';

export interface AuthSuccessAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface AuthSuccessCardProps {
  title: string;
  message: React.ReactNode;
  primaryAction: AuthSuccessAction;
  secondaryActions?: AuthSuccessAction[];
  icon?: React.ReactNode;
}

export function AuthSuccessCard({
  title,
  message,
  primaryAction,
  secondaryActions = [],
  icon = <CheckCircle size={48} strokeWidth={2.5} />,
}: AuthSuccessCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto shadow-surface-pop overflow-visible">
      <CardBody className="flex flex-col items-center text-center p-8 space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-bold text-text">{title}</h2>
          <div className="text-sm text-text-muted leading-relaxed">
            {message}
          </div>
        </div>

        {secondaryActions.length > 0 && (
          <div className={`grid grid-cols-${secondaryActions.length} gap-3 w-full`}>
            {secondaryActions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || 'secondary'}
                size="md"
                onClick={action.onClick}
                leftIcon={action.icon}
                className="font-semibold"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        <Button
          variant={primaryAction.variant || 'primary'}
          size="lg"
          fullWidth
          onClick={primaryAction.onClick}
          className="font-bold text-base tracking-wide mt-2"
        >
          {primaryAction.label}
        </Button>
      </CardBody>
    </Card>
  );
}

export interface ChannelConnectItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isConnected?: boolean;
}

export interface ChannelConnectListProps {
  title: string;
  subtitle?: string;
  channels: ChannelConnectItem[];
  connectLabel?: string;
  connectedLabel?: string;
  onConnect: (id: string) => void;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

export function ChannelConnectList({
  title,
  subtitle,
  channels,
  connectLabel = 'Connect',
  connectedLabel = 'Connected',
  onConnect,
  primaryAction,
  secondaryAction,
}: ChannelConnectListProps) {
  return (
    <Card className="w-full max-w-md mx-auto shadow-surface-pop">
      <CardBody className="p-8 space-y-8">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-heading font-bold text-text">{title}</h2>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>

        <div className="space-y-3">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between p-4 rounded-input bg-panel-strong/20 border border-border/10 group transition-all hover:bg-panel-strong/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-strong flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                  {channel.icon}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-text">{channel.name}</p>
                  <p className="text-[10px] text-text-muted line-clamp-1">{channel.description}</p>
                </div>
              </div>
              <Button
                variant={channel.isConnected ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => onConnect(channel.id)}
                className="px-4"
              >
                {channel.isConnected ? connectedLabel : connectLabel}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button variant="primary" size="lg" fullWidth onClick={primaryAction.onClick} className="font-bold">
            {primaryAction.label}
          </Button>
          {secondaryAction && (
            <Button variant="ghost" size="md" fullWidth onClick={secondaryAction.onClick} className="text-text-muted">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
