import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { I18nProvider, useI18n } from '../src/i18n/I18nProvider';

function I18nTestComponent() {
  const { language, setLanguage, t } = useI18n();

  return (
    <>
      <Text testID="lang">{language}</Text>
      <Text testID="title">{t('nav.home')}</Text>
      <Text testID="missing">{t('non.existent.key' as any)}</Text>
      <Text testID="param">{t('dashboard.timeMinutesAgo', { n: 5 })}</Text>
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
});
