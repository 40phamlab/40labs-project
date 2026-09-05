import {
  Button,
  IconButton,
  Badge,
  Separator,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  Toggle,
  Checkbox,
  Select,
  Spinner,
  Skeleton,
  Panel,
  PriceDisplay,
  DiscountDisplay,
  QuantityControl,
  ProductCard,
  ProductRow,
  ProductResult,
  ProductSearch,
  CartItem,
  CartSummary,
  Cart,
  CustomerSelector,
  CustomerSummary,
  OrderStatus,
  OrderSummary,
  PaymentSummary,
  PaymentMethodSelector,
} from '../index';
import React, { useState } from 'react';

export function ComponentLab() {
  const [qty, setQty] = useState(1);
  const [search, setSearch] = useState('');
  const [custSearch, setCustSearch] = useState('');
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [payMethod, setPayMethod] = useState('cash');

  const mockCustomers = [
    { id: 1, full_name: 'John Doe', phone: '0712 345 678', outstanding_balance: 50000 },
    { id: 2, full_name: 'Jane Smith', phone: '0655 111 222', outstanding_balance: 0 },
  ];

  const filteredCustomers = mockCustomers.filter(c =>
    c.full_name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone.includes(custSearch)
  );

  return (
    <div className="p-8 space-y-16 bg-surface min-h-screen text-text pb-32">
      <header className="border-b border-border/20 pb-4">
        <h1 className="text-3xl font-heading font-bold text-primary">40Labs Component Lab</h1>
        <p className="text-text-muted mt-1">Commerce & Sales Composites (Phase 7)</p>
      </header>

      {/* COMMERCE PRIMITIVES */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-heading font-bold text-primary">1. Commerce Primitives</h2>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Pricing & Controls</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Price Display</h3>
            <div className="space-y-4">
              <PriceDisplay amount="45,000" size="sm" />
              <PriceDisplay amount="120,000" size="md" originalAmount="150,000" />
              <PriceDisplay amount="2,450,000" size="lg" />
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Discounts</h3>
            <div className="space-y-4">
              <DiscountDisplay percentage={15} />
              <DiscountDisplay label="Flash Sale" amount="5,000" percentage={10} />
              <DiscountDisplay label="Loyalty Reward" amount="2,500" />
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Quantity Control</h3>
            <div className="space-y-4 flex flex-col items-center">
              <QuantityControl value={qty} onIncrement={() => setQty(qty + 1)} onDecrement={() => setQty(Math.max(0, qty - 1))} />
              <QuantityControl value={qty} onIncrement={() => setQty(qty + 1)} onDecrement={() => setQty(Math.max(0, qty - 1))} size="sm" />
            </div>
          </Card>
        </div>
      </section>

      {/* PRODUCT COMPONENTS */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-heading font-bold text-primary">2. Product Components</h2>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Discovery & Listing</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Product Discovery</h3>
            <ProductSearch
              value={search}
              onChange={setSearch}
              results={search.length > 0 && (
                <>
                  <ProductResult name="Panadol Advance 500mg" subtitle="Paracetamol • 20 Tabs" price="TZS 2,500" />
                  <ProductResult name="Amoxicillin 250mg" subtitle="Antibiotic • 10 Caps" price="TZS 8,000" highlight />
                  <ProductResult name="Cough Syrup 100ml" subtitle="Expectorant" price="TZS 4,500" />
                </>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <ProductCard
                name="Aspirin 100mg"
                subtitle="Bayer"
                stock={45}
                price="TZS 1,200"
                info="Exp: 12/2025"
                onClick={() => {}}
              />
              <ProductCard
                name="Vitamin C 500mg"
                subtitle="Ascorbic Acid"
                stock="Out of stock"
                price="TZS 3,500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">List View</h3>
            <div className="space-y-2">
              <ProductRow name="Metformin 500mg" sku="MET-500-A" stock={120} price="TZS 15,000" onAdd={() => {}} />
              <ProductRow name="Loratadine 10mg" sku="LOR-010-B" stock={85} price="TZS 4,500" onAdd={() => {}} />
              <ProductRow name="Ibuprofen 400mg" sku="IBU-400-C" stock={200} price="TZS 2,200" onAdd={() => {}} />
            </div>
          </div>
        </div>
      </section>

      {/* CART & CHECKOUT */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-heading font-bold text-primary">3. Cart & Checkout</h2>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Transaction Flow</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Active Cart</h3>
            <Cart>
              <CartItem
                name="Panadol Advance 500mg"
                unitPrice="2,500"
                quantity={2}
                subtotal="5,000"
                onRemove={() => {}}
              />
              <CartItem
                name="Amoxicillin 250mg"
                unitPrice="8,000"
                quantity={1}
                subtotal="8,000"
                onRemove={() => {}}
              />
            </Cart>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Payment Selection</h3>
              <PaymentMethodSelector selectedMethod={payMethod} onSelect={setPayMethod} />
              <PaymentSummary
                payments={[
                  { method: 'Cash', amount: 'TZS 10,000', reference: 'CASH-882' },
                  { method: 'Mobile Money', amount: 'TZS 3,000', reference: 'M-PESA: QWE123RTY' }
                ]}
                totalPaid="TZS 13,000"
                remainingBalance="TZS 0"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Summary</h3>
            <CartSummary
              subtotal="13,000"
              tax="2,340"
              discount="500"
              total="14,840"
              onCheckout={() => alert('Processing Transaction...')}
            />

            <OrderSummary
              orderNumber="ORD-2023-001"
              date="24 Oct 2023, 14:30"
              status="completed"
              itemCount={3}
              total="TZS 14,840"
            />

            <div className="flex flex-wrap gap-2">
              <OrderStatus status="pending" />
              <OrderStatus status="completed" />
              <OrderStatus status="cancelled" />
              <OrderStatus status="refunded" />
              <OrderStatus status="processing" />
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER MANAGEMENT */}
      <section className="space-y-6 pb-20">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-heading font-bold text-primary">4. Customer Management</h2>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">CRM Composites</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Customer Selector</h3>
            <CustomerSelector
              searchQuery={custSearch}
              onSearchChange={setCustSearch}
              results={filteredCustomers}
              selectedCustomer={selectedCust}
              onSelect={setSelectedCust}
              onClearSelection={() => setSelectedCust(null)}
              onWalkIn={() => alert('Selected Walk-in')}
              onCreateNew={() => alert('Create new customer: ' + custSearch)}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Customer Profile</h3>
            <CustomerSummary
              customer={selectedCust}
              isWalkIn={!selectedCust && custSearch === 'walkin'}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
