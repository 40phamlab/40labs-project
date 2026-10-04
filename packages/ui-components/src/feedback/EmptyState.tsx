"use client";

import * as React from 'react';
import { FolderOpen, SearchX, AlertCircle, WifiOff, Lock } from 'lucide-react';
import { Button } from '../primitives/Button';
import { t, TranslationKey } from '@40labs/i18n';

export type EmptyStateVariant = 'empty' | 'filtered' | 'error' | 'offline' | 'noAccess';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  titleKey?: TranslationKey | string;
  description?: string;
  descriptionKey?: TranslationKey | string;
  message?: string;
  action?: {
    label?: string;
    labelKey?: TranslationKey | string;
    onClick: () => void;
  } | React.ReactNode;
  variant?: EmptyStateVariant;
  compact?: boolean;
  className?: string;
}

const defaultIcons: Record<EmptyStateVariant, React.ReactNode> = {
  empty: <FolderOpen size={24} />,
  filtered: <SearchX size={24} />,
  error: <AlertCircle size={24} />,
  offline: <WifiOff size={24} />,
  noAccess: <Lock size={24} />,
};

const defaultTitleKeys: Record<EmptyStateVariant, TranslationKey> = {
  empty: 'emptystate.empty.title',
  filtered: 'emptystate.filtered.title',
  error: 'emptystate.error.title',
  offline: 'emptystate.offline.title',
  noAccess: 'emptystate.noAccess.title',
};

const defaultDescKeys: Record<EmptyStateVariant, TranslationKey> = {
  empty: 'emptystate.empty.desc',
  filtered: 'emptystate.filtered.desc',
  error: 'emptystate.error.desc',
  offline: 'emptystate.offline.desc',
  noAccess: 'emptystate.noAccess.desc',
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  titleKey,
  description,
  descriptionKey,
  message,
  action,
  variant = 'empty',
  compact = false,
  className = '',
}) => {
  const resolvedTitle = title || t(titleKey ? (titleKey as any) : defaultTitleKeys[variant]);
  const resolvedDesc = description || message || t(descriptionKey ? (descriptionKey as any) : defaultDescKeys[variant]);
  const resolvedIcon = icon || defaultIcons[variant];

  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action)) {
      return <div className="mt-4">{action}</div>;
    }
    if (typeof action === 'object' && 'onClick' in action) {
      const actionObj = action as { label?: string; labelKey?: TranslationKey | string; onClick: () => void };
      return (
        <div className="mt-4">
          <Button intent="primary" size="sm" onClick={actionObj.onClick}>
            {actionObj.label || (actionObj.labelKey ? t(actionObj.labelKey as any) : (variant === 'filtered' ? t('emptystate.filtered.action') : variant === 'error' ? t('emptystate.error.action') : 'Action'))}
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      role="region"
      aria-label={resolvedTitle}
      className={`
        flex flex-col items-center justify-center text-center
        ${compact ? 'p-4' : 'p-8'}
        max-w-[360px] mx-auto rounded-[12px] border border-dashed border-border bg-surface-primary/40
        ${className}
      `}
    >
      <div className="w-12 h-12 rounded-full bg-success-bg text-action-primary flex items-center justify-center mb-3">
        {resolvedIcon}
      </div>
      <h3 className="font-heading text-[16px] leading-[24px] font-semibold text-text-primary">
        {resolvedTitle}
      </h3>
      {resolvedDesc && (
        <p className="text-ui-small text-text-secondary mt-1">
          {resolvedDesc}
        </p>
      )}
      {renderAction()}
    </div>
  );
};
