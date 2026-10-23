// [PHASE: marketplace-preview — Deals tab fix]
import * as React from 'react';
import { PurchaseOrder, CatalogProduct } from '@40labs/types';
import { StatusBadge, Button } from '@40labs/ui-components';
import { Tag, Package, MessageSquare, ShoppingBag, RotateCcw, ArrowRight } from 'lucide-react';
import { useToast } from '../../../../hooks/useToast';
import { normalizeToE164 } from '../../data/channels/phone';

export interface DealsTabProps {
  orders: PurchaseOrder[];
  catalogProducts: CatalogProduct[];
  supplierName: string;
  supplierPhone?: string;
  onSelectOrder: (orderId: string) => void;
  onAddToCart: (product: CatalogProduct, qty: number) => void;
  onSwitchTab: (tabId: string) => void;
}

export const DealsTab: React.FC<DealsTabProps> = ({
  orders,
  catalogProducts,
  supplierName,
  supplierPhone,
  onSelectOrder,
  onAddToCart,
  onSwitchTab,
}) => {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'pending') return ['draft', 'sent', 'confirmed'].includes(o.status);
      if (filterStatus === 'completed') return o.status === 'completed';
      if (filterStatus === 'cancelled') return o.status === 'cancelled';
      return true;
    });
  }, [orders, filterStatus]);

  const counts = React.useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => ['draft', 'sent', 'confirmed'].includes(o.status)).length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  const totalSpent = React.useMemo(() => orders.reduce((sum, o) => sum + o.totalTzs, 0), [orders]);
  const avgOrder = orders.length > 0 ? Math.round(totalSpent / orders.length) : 0;
  const lastOrderDate = orders.length > 0 ? new Date(orders[0].updatedAt).toLocaleDateString() : '—';

  const handleReorder = (e: React.MouseEvent, order: PurchaseOrder) => {
    e.stopPropagation();
    let addedCount = 0;
    const unavailableNames: string[] = [];

    order.lines.forEach((line) => {
      const catalogProd = catalogProducts.find(
        (p) => p.id === line.productId || p.name.toLowerCase() === line.name?.toLowerCase()
      );
      if (catalogProd && catalogProd.stock !== 'out') {
        onAddToCart(catalogProd, line.qty);
        addedCount++;
      } else {
        unavailableNames.push(line.name || line.productId);
      }
    });

    if (unavailableNames.length > 0) {
      toast({
        title: 'Reorder Summary / Muhtasari wa Oda',
        description: `${addedCount} item(s) added to cart, ${unavailableNames.length} unavailable (${unavailableNames.join(', ')}).`,
        intent: 'success',
      });
    } else {
      toast({
        title: 'Reorder Success / Oda Imefanikiwa',
        description: `Successfully added ${addedCount} item(s) to cart from order ${order.id.slice(0, 8)}.`,
        intent: 'success',
      });
    }

    onSwitchTab('cart');
  };

  const handleCommunicate = (e: React.MouseEvent, order: PurchaseOrder) => {
    e.stopPropagation();
    const rawPhone = supplierPhone || '+255700000000';
    const e164 = normalizeToE164(rawPhone);
    const phoneClean = e164 ? e164.replace('+', '') : '255700000000';
    const shortCode = order.id.slice(0, 8);
    const msg = encodeURIComponent(
      `Hello ${supplierName}, I am inquiring about past order #${shortCode}. Buyer ID: AFYA-MYPHARMACY.`
    );
    window.open(`https://wa.me/${phoneClean}?text=${msg}`, '_blank');
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-text-muted gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
          <Tag size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text">No deals with {supplierName} yet</h3>
          <p className="text-xs italic max-w-sm text-text-muted">
            You haven't placed any purchase orders with this supplier yet. / Huna historia ya oda na mtoa huduma huyu.
          </p>
        </div>
        <Button intent="primary" size="md" onClick={() => onSwitchTab('products')} leftIcon={<ShoppingBag size={16} />}>
          Browse products / Vinjari bidhaa
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full pb-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-panel-strong border border-border/30 rounded-card shrink-0 shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Orders / Oda</span>
          <p className="font-mono text-base font-bold text-text">{orders.length}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Spent / Jumla</span>
          <p className="font-mono text-base font-bold text-primary">TZS {totalSpent.toLocaleString()}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Last Order / Oda ya Mwisho</span>
          <p className="font-mono text-base font-bold text-text">{lastOrderDate}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Avg Order / Wastani</span>
          <p className="font-mono text-base font-bold text-text">TZS {avgOrder.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 bg-panel-strong p-1 rounded-input border border-border/30 shrink-0 overflow-x-auto">
        {[
          { id: 'all', label: 'All / Zote', count: counts.all },
          { id: 'pending', label: 'Pending / Zinazosubiri', count: counts.pending },
          { id: 'completed', label: 'Completed / Zilizokamilika', count: counts.completed },
          { id: 'cancelled', label: 'Cancelled / Zilizofutwa', count: counts.cancelled },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id as any)}
            className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterStatus === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filterStatus === tab.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-panel border border-border/30 text-text-muted'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* DealRow List */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted gap-2">
            <p className="text-xs italic">No orders found matching this filter. / Hakuna oda zilizopatikana.</p>
          </div>
        ) : (
          filteredOrders.map((o) => {
            const shortCode = `#PO-${o.id.slice(-6).toUpperCase()}`;
            const dateStr = new Date(o.updatedAt).toLocaleDateString();
            const totalFormatted = `TZS ${o.totalTzs.toLocaleString()}`;
            const itemNames = o.lines.map((l) => l.name || l.productId);
            const itemsSummary =
              itemNames.length <= 2
                ? itemNames.join(', ')
                : `${itemNames.slice(0, 2).join(', ')} +${itemNames.length - 2} more`;

            return (
              <div
                key={o.id}
                onClick={() => onSelectOrder(o.id)}
                className="h-[72px] w-full bg-panel border border-border/30 rounded-[12px] px-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-panel-strong/80 hover:border-primary/40 transition-all select-none group shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Package size={18} />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-text">{shortCode}</span>
                      <span className="text-[11px] text-text-muted">{dateStr}</span>
                      <span className="p-1 rounded bg-panel-strong text-text-muted" title={`Channel: ${o.channel}`}>
                        <MessageSquare size={12} />
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate max-w-xs md:max-w-md" title={itemsSummary}>
                      {itemsSummary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono font-bold text-text text-xs">{totalFormatted}</span>
                  <StatusBadge
                    status={o.status === 'completed' ? 'success' : o.status === 'confirmed' ? 'active' : o.status === 'sent' ? 'warning' : 'inactive'}
                    label={o.status.toUpperCase()}
                  />

                  {/* Strict action row with min-w-0 and no wrap */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title="Reorder items / Oda tena"
                      onClick={(e) => handleReorder(e, o)}
                      className="p-2 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      type="button"
                      title="Communicate via WhatsApp / Wasiliana"
                      onClick={(e) => handleCommunicate(e, o)}
                      className="p-2 rounded bg-panel-strong border border-border/30 text-text-muted hover:text-text hover:bg-border/20 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      <MessageSquare size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
