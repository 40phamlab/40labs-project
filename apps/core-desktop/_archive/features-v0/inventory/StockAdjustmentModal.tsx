// [PHASE: MVP]
// [SPEC: CONTEXT/SPEC/inventory.md, CONTEXT/01-ARCHITECTURE.md]
import React, { useState } from 'react';
import { Card, Input, Button } from '@40labs/ui-components';
import type { InventoryItemWithMedicine } from './useInventory';

interface StockAdjustmentModalProps {
  item: InventoryItemWithMedicine;
  onConfirm: (payload: { delta: number; reason: string; pin: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * StockAdjustmentModal
 * PIN-gated interface for manual stock corrections (loss, damage, etc).
 *
 * DESIGN RULE: PIN entry is a frontend convenience only. Server-side (Tauri/Axum)
 * MUST re-verify authorization before writing.
 */
export function StockAdjustmentModal({
  item,
  onConfirm,
  onCancel,
  isSubmitting = false
}: StockAdjustmentModalProps) {
  const [delta, setDelta] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const projectedQuantity = item.quantity + delta;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (delta === 0) {
      setError('Adjustment amount cannot be zero.');
      return;
    }
    if (!reason.trim()) {
      setError('A reason for the adjustment is required.');
      return;
    }
    if (!pin) {
      setError('Staff PIN is required for authorization.');
      return;
    }

    /**
     * TODO [MUTATION]:
     * When wiring to real Tauri commands/sqlx:
     * 1. Start Transaction.
     * 2. Insert AuditLogEntry (action: 'stock_adjustment', target_entity_id: item.id).
     * 3. Insert StockAdjustment (referencing the audit_log_id created above).
     * 4. Update InventoryItem quantity.
     * 5. Commit Transaction.
     *
     * PER GOTCHAS.MD #9: App layer must enforce insert order (AuditLog first)
     * as there is no DB-level FK on stock_adjustment.audit_log_id.
     */
    onConfirm({ delta, reason, pin });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
        <header>
          <h2 className="font-heading text-xl text-black/80">Stock Adjustment</h2>
          <p className="text-sm text-black/50 font-ui">
            Adjusting <span className="font-semibold text-black/70">{item.medicine.name}</span>
          </p>
          <div className="mt-1 text-[10px] text-black/40 font-mono uppercase tracking-tighter">
            Batch: {item.batch_number}
          </div>
        </header>

        <div className="flex justify-between items-center bg-surface p-3 rounded-input elevation-inset">
          <div className="text-center flex-1 border-r border-black/5">
            <p className="text-[10px] uppercase text-black/40 font-ui mb-0.5">Current</p>
            <p className="text-lg font-mono font-bold text-black/70">{item.quantity}</p>
          </div>
          <div className="text-center flex-1 px-2">
            <p className="text-[10px] uppercase text-black/40 font-ui mb-0.5">Adjustment</p>
            <p className={['text-lg font-mono font-bold', delta > 0 ? 'text-primary' : delta < 0 ? 'text-danger' : 'text-black/30'].join(' ')}>
              {delta > 0 ? `+${delta}` : delta}
            </p>
          </div>
          <div className="text-center flex-1 border-l border-black/5">
            <p className="text-[10px] uppercase text-black/40 font-ui mb-0.5">Result</p>
            <p className="text-lg font-mono font-bold text-black/70">{projectedQuantity}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Adjustment (+/-)"
            type="number"
            monospace
            placeholder="e.g. -5 or 10"
            value={delta || ''}
            onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
          />

          <Input
            label="Reason"
            placeholder="e.g. Damaged during storage, expiry correction"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="pt-2 border-t border-black/5 mt-2">
            <Input
              label="Authorize with Staff PIN"
              type="password"
              placeholder="••••"
              maxLength={4}
              monospace
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            />
            <p className="text-[10px] text-black/40 mt-1 italic font-ui">
              * PIN is required to generate the mandatory audit log entry.
            </p>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 p-2 rounded-input">
              <p className="text-xs text-danger font-ui font-medium text-center">{error}</p>
            </div>
          )}

          <footer className="flex gap-3 pt-4">
            <Button
              intent="secondary"
              type="button"
              fullWidth
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              intent="primary"
              type="submit"
              fullWidth
              loading={isSubmitting}
            >
              Confirm Adjustment
            </Button>
          </footer>
        </form>
      </Card>
    </div>
  );
}
