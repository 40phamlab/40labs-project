// [PHASE: MVP]
import { Button } from '@40labs/ui-components';
import { useSaleCart } from './useSales';
import { useInventoryList } from '../inventory/useInventory';

/** Cart cards for the customer-first POS. */
export function SaleCartTable() {
  const { lines, setQty, removeLine } = useSaleCart();
  const { data: inventory = [] } = useInventoryList();

  if (lines.length === 0) return <div className="flex h-full min-h-48 items-center justify-center rounded-card border border-dashed border-black/10 bg-surface px-8"><div className="text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">🛒</div><p className="font-ui font-medium text-black/55">Cart is empty</p><p className="mt-1 text-xs text-black/35">Search inventory on the right and click a medicine to add it.</p></div></div>;

  return <div className="flex flex-col gap-3">{lines.map((line) => { const item = inventory.find((inventoryItem) => inventoryItem.id === line.inventory_item_id); if (!item) return null; return <div key={line.id} className="group flex items-center gap-4 rounded-card bg-surface p-4 elevation-raised"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card bg-surface-strong text-black/20 elevation-inset">▦</div><div className="min-w-0 flex-1"><p className="truncate font-ui font-semibold text-black/80">{item.medicine.name}</p><p className="mt-1 text-xs text-black/40">Unit: <span className="font-mono">TZS {line.unit_price.toLocaleString()}</span></p></div><div className="flex items-center gap-2 rounded-full bg-surface-strong p-1 elevation-inset"><button type="button" onClick={() => setQty(line.id, line.quantity - 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-black/55 elevation-raised">−</button><span className="w-8 text-center font-mono text-sm font-semibold text-black/70">{line.quantity}</span><button type="button" onClick={() => setQty(line.id, line.quantity + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white elevation-raised">+</button></div><p className="w-28 text-right font-mono text-base font-bold text-primary">{line.subtotal.toLocaleString()}</p><Button intent="danger" size="sm" className="!h-9 !w-9 !p-0 !rounded-full" onClick={() => removeLine(line.id)} aria-label={`Remove ${item.medicine.name}`}>×</Button></div>; })}</div>;
}
