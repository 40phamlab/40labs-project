# Shared Commerce Components (`src/shared/commerce/`)

This module contains shared, presentational commerce UI components reused across POS (`mode: 'sale'`) and Supplier Marketplace Purchases (`mode: 'purchase'`).

## Components & Props Contract

1. **`ProductCard`**
   - Renders a product card/row with image, name, subtitle, pricing, stock chip, and action buttons.
   - Props: `id`, `name`, `subtitle`, `unitPrice`, `oldUnitPrice`, `stock`, `unitType`, `mode`, `cartQty`, `isPriceEditable`, `onPriceChange`, `onAddToCart`, `onUpdateQty`, `onMoreAbout`, `onSeeAlternatives`, `onChat`, `disabled`, `imageSrc`, `className`.

2. **`CartLine`**
   - Renders a cart item row with quantity stepper, unit chip, unit price, subtotal, and remove button.
   - Props: `id`, `name`, `subtitle`, `unitPrice`, `quantity`, `maxStock`, `unitType`, `stockStatus`, `discountAmount`, `mode`, `isPriceEditable`, `onPriceChange`, `onQuantityChange`, `onRemove`, `className`.

3. **`CartSummary`**
   - Renders the order/sale totals bar with subtotal, discount/delivery, tax, grand total, payment method selector (in sale mode), and primary CTA button.
   - Props: `subtotal`, `discount`, `onDiscountChange`, `tax`, `grandTotal`, `paymentMethod`, `onPaymentMethodChange`, `onConfirm`, `onDelete`, `onHold`, `disabled`, `isProcessing`, `mode`, `ctaLabel`, `deliveryNote`, `className`.

4. **`QtyStepper`**
   - Plus/minus quantity control.
   - Props: `value`, `min`, `max`, `onChange`, `size`, `disabled`, `className`.

5. **`UnitChip`**
   - Renders packaging unit badge (e.g. PACK, STRIP).
   - Props: `unit`, `className`.

6. **`ProductImage`**
   - Renders product image or fallback pill icon.
   - Props: `src`, `alt`, `fallbackIcon`, `className`.
