import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeScreen from '../app/(tabs)/index';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { ThemeProvider } from '../src/theme/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Orbit Worker Foundation', () => {
  it('renders home screen text successfully', () => {
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <I18nProvider>
            <HomeScreen />
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
    expect(getByText('Dashibodi')).toBeTruthy();
  });
});
