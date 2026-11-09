import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { I18nProvider, useI18n } from '../src/i18n/I18nProvider';
import { t as baseT, TranslationKey } from '@40labs/i18n';

function I18nTestComponent() {
  const { language, setLanguage, t } = useI18n();

  return (
    <>
      <Text testID="lang">{language}</Text>
      <Text testID="title">{t('nav.home')}</Text>
      <Text testID="missing">{t('non.existent.key' as any)}</Text>
      <Text testID="param">{t('dashboard.timeMinutesAgo', { count: 5 })}</Text>
      <TouchableOpacity testID="toggle-lang" onPress={() => setLanguage(language === 'sw-TZ' ? 'en' : 'sw-TZ')}>
        <Text>Toggle</Text>
      </TouchableOpacity>
    </>
  );
}

describe('Orbit Internationalization (i18n)', () => {
  it('defaults to sw-TZ, supports switching, parameters, and missing keys', () => {
    const { getByTestId } = render(
      <I18nProvider>
        <I18nTestComponent />
      </I18nProvider>
    );

    expect(getByTestId('lang').props.children).toBe('sw-TZ');
    expect(getByTestId('title').props.children).toBe('Nyumbani');
    expect(getByTestId('missing').props.children).toBe('non.existent.key');
    expect(getByTestId('param').props.children).toBe('Dakika 5 zilizopita');

    fireEvent.press(getByTestId('toggle-lang'));

    expect(getByTestId('lang').props.children).toBe('en');
    expect(getByTestId('title').props.children).toBe('Home');
    expect(getByTestId('param').props.children).toBe('5m ago');
  });

  it('verifies critical keys exist and do not return raw keys', () => {
    expect(baseT('nav.history')).not.toBe('nav.history');
    expect(baseT('dashboard.inventoryValue')).not.toBe('dashboard.inventoryValue');
    expect(baseT('dashboard.salesAndProfitOverview')).not.toBe('dashboard.salesAndProfitOverview');
    expect(baseT('pairing.scan')).not.toBe('pairing.scan');
  });

  it('fails if any t() translation returns raw key pattern /^[a-z]+\\.[a-zA-Z.]+$/', () => {
    const sampleKeys: TranslationKey[] = [
      'nav.home',
      'nav.history',
      'dashboard.inventoryValue',
      'inventory.addStockTitle',
      'customers.registerPatientTitle',
      'sales.shoppingCart',
    ];

    sampleKeys.forEach((key) => {
      const translation = baseT(key);
      const isRawKey = /^[a-z]+\.[a-zA-Z.]+$/.test(translation);
      expect(isRawKey).toBe(false);
    });
  });
});
