import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SaleTotalsBar } from '../components/SaleTotalsBar';
import { t } from '@40labs/i18n';

describe('SaleTotalsBar Layout & Overflow Tests', () => {
  test('renders without horizontal overflow at 1366px and 1920px viewports with 6-digit totals', () => {
    const widths = [1366, 1920];

    widths.forEach((width) => {
      const container = document.createElement('div');
      container.style.width = `${width}px`;
      document.body.appendChild(container);

      const { unmount } = render(
        <SaleTotalsBar
          subtotal={12345678}
          discount={0}
          onDiscountChange={() => {}}
          tax={0}
          grandTotal={12345678}
          paymentMethod="cash"
          onPaymentMethodChange={() => {}}
          onConfirm={() => {}}
          onDelete={() => {}}
          onHold={() => {}}
          disabled={false}
          isProcessing={false}
        />,
        { container }
      );

      const barElement = container.firstElementChild as HTMLElement;
      expect(barElement).not.toBeNull();

      // Assert no horizontal overflow (scrollWidth <= clientWidth)
      expect(barElement.scrollWidth).toBeLessThanOrEqual(barElement.clientWidth);

      unmount();
      document.body.removeChild(container);
    });
  });

  test('renders swahili default and english labels and tooltips correctly', () => {
    const container = document.createElement('div');
    container.style.width = '1366px';
    document.body.appendChild(container);

    const { unmount } = render(
      <SaleTotalsBar
        subtotal={34500}
        discount={0}
        onDiscountChange={() => {}}
        tax={0}
        grandTotal={34500}
        paymentMethod="cash"
        onPaymentMethodChange={() => {}}
        onConfirm={() => {}}
        onDelete={() => {}}
        onHold={() => {}}
        disabled={false}
        isProcessing={false}
      />,
      { container }
    );

    expect(screen.getByText(t('sales.confirm', 'sw-TZ'))).toBeDefined();
    expect(screen.getByText(t('sales.hold', 'sw-TZ'))).toBeDefined();
    expect(screen.getByText(t('sales.clear', 'sw-TZ'))).toBeDefined();

    const confirmBtn = screen.getByText(t('sales.confirm', 'sw-TZ')).closest('button');
    expect(confirmBtn?.getAttribute('title')).toBe('Ctrl+Enter');

    unmount();
    document.body.removeChild(container);
  });
});
