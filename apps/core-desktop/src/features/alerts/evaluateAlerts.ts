import { evaluateAlerts as evaluateAlertsImpl, EvaluationSnapshot } from './alertRules';
import { DEFAULT_ALERT_THRESHOLDS, AlertThresholds } from './alertThresholds';
import type { Alert } from '@40labs/types';

export type { EvaluationSnapshot };

export function evaluateAlerts(
  snapshot: EvaluationSnapshot,
  thresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS
): Alert[] {
  return evaluateAlertsImpl(snapshot, thresholds);
}
