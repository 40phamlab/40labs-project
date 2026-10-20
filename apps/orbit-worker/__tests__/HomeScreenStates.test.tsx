import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomeScreen } from '../src/features/home/HomeScreen';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { useConnectionStore } from '../src/stores/connection';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

describe('HomeScreen states and quick actions presence', () => {
  const states: Array<'unpaired' | 'connected' | 'unreachable' | 'revoked'> = [
    'unpaired',
    'connected',
    'unreachable',
    'revoked',
  ];

  states.forEach((stateVal) => {
    it(`renders quick actions when connection state is ${stateVal}`, () => {
      useConnectionStore.setState({
        status: stateVal,
        activeBusinessId: stateVal === 'unpaired' ? null : 'biz-1',
        permissions: ['can_update_stock', 'can_create_sale', 'can_add_lab_sample', 'can_record_lab_result', 'can_view_stock', 'can_manage_customers'],
        userInfo: { name: 'Dr. Juma', role: 'Pharmacist' },
      });

      const { getByText } = render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <I18nProvider>
              <HomeScreen />
            </I18nProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Verify quick actions are always rendered in all states (Swahili default per PRD P0-12)
      expect(getByText('Ongeza Bidhaa')).toBeTruthy();
      expect(getByText('Mauzo Mapya')).toBeTruthy();
    });
  });
});
