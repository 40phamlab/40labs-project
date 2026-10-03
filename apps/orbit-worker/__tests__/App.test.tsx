import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/index';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { ThemeProvider } from '../src/theme/ThemeProvider';

describe('Orbit Worker Foundation', () => {
  it('renders home screen text successfully', () => {
    const { getByText } = render(
      <ThemeProvider>
        <I18nProvider>
          <HomeScreen />
        </I18nProvider>
      </ThemeProvider>
    );
    expect(getByText('Dashibodi')).toBeTruthy();
  });
});
