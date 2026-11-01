import type { LabWorkflowStepType } from '@40labs/types';

export interface NodeThemeConfig {
  category: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  bg: string;
  iconColor: string;
  colorHex: string;
}

const THEME_MAP: Record<string, NodeThemeConfig> = {
  intake: {
    category: 'Intake',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    colorHex: '#3b82f6',
  },
  prep: {
    category: 'Preparation',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    colorHex: '#f59e0b',
  },
  analysis: {
    category: 'Analysis',
    badgeBg: 'bg-green-100 dark:bg-green-950/60',
    badgeText: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-800',
    bg: 'bg-green-50/50 dark:bg-green-950/20',
    iconColor: 'text-green-600 dark:text-green-400',
    colorHex: '#10b981',
  },
  quality: {
    category: 'Quality Check',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800',
    bg: 'bg-purple-50/50 dark:bg-purple-950/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    colorHex: '#8b5cf6',
  },
  logic: {
    category: 'Logic & Decision',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/60',
    badgeText: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-800',
    bg: 'bg-orange-50/50 dark:bg-orange-950/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    colorHex: '#f97316',
  },
  output: {
    category: 'Output & Reporting',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
    badgeText: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-800',
    bg: 'bg-teal-50/50 dark:bg-teal-950/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
    colorHex: '#14b8a6',
  },
  misc: {
    category: 'Attachments & Notes',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    iconColor: 'text-slate-600 dark:text-slate-400',
    colorHex: '#64748b',
  },
  unknown: {
    category: 'Unknown',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
    colorHex: '#f43f5e',
  },
};

const STEP_TO_THEME: Record<string, string> = {
  sample_reception: 'intake',
  specimen_identification: 'intake',
  registration: 'intake',
  collection: 'intake',
  receive: 'intake',
  preparation_processing: 'prep',
  process: 'prep',
  test_execution: 'analysis',
  observation_entry: 'analysis',
  result_entry: 'analysis',
  qc_check: 'quality',
  review_approval: 'quality',
  review: 'quality',
  conditional_decision: 'logic',
  repeat_rework: 'logic',
  report_finalization: 'output',
  report_draft: 'output',
  notify: 'output',
  forward_report: 'output',
  notes_attachments: 'misc',
};

export function getNodeTheme(stepType: string | undefined): NodeThemeConfig & { isUnknown: boolean } {
  if (!stepType || !STEP_TO_THEME[stepType]) {
    return { ...THEME_MAP.unknown, isUnknown: true };
  }
  const key = STEP_TO_THEME[stepType];
  return { ...(THEME_MAP[key] || THEME_MAP.misc), isUnknown: false };
}
