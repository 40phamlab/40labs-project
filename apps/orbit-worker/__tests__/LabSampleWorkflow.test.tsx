import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import LabSampleScreen from '../app/lab-sample';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { useConnectionStore } from '../src/stores/connection';

describe('Orbit Worker Mobile Sample Collection Workflow', () => {
  beforeEach(() => {
    useConnectionStore.setState({
      status: 'connected',
      activeBusinessId: 'biz-1',
      permissions: ['can_add_lab_sample'],
    });
  });

  it('renders lab sample collection screen title and empty state or orders', async () => {
    const { getByText } = render(
      <ThemeProvider>
        <I18nProvider>
          <LabSampleScreen />
        </I18nProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Collect Sample')).toBeTruthy();
    });
  });
});
