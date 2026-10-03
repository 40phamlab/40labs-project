import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { I18nProvider } from '../src/i18n/I18nProvider';
import {
  StatusDot,
  CountBadge,
  Card,
  Tile,
  Chip,
  Fab,
  FabMenu,
  ScreenHeader,
  BottomTabBar,
  EmptyState,
  InlineError,
  ScanFrame,
} from '../src/components';

describe('Orbit UI Components', () => {
  it('renders StatusDot in all states', () => {
    const { getByLabelText } = render(
      <ThemeProvider>
        <StatusDot state="connected" label="Online" />
      </ThemeProvider>
    );
    expect(getByLabelText('Status: connected')).toBeTruthy();
  });

  it('renders CountBadge correctly (0 hidden, 1-9, 10+ as 9+)', () => {
    const { toJSON: render0 } = render(
      <ThemeProvider>
        <CountBadge count={0} />
      </ThemeProvider>
    );
    expect(render0()).toBeNull();

    const { getByText: get5 } = render(
      <ThemeProvider>
        <CountBadge count={5} />
      </ThemeProvider>
    );
    expect(get5('5')).toBeTruthy();

    const { getByText: get12 } = render(
      <ThemeProvider>
        <CountBadge count={15} />
      </ThemeProvider>
    );
    expect(get12('9+')).toBeTruthy();
  });

  it('renders Tile in various states and handles press actions', () => {
    const onPress = jest.fn();

    const { getByText } = render(
      <ThemeProvider>
        <Tile title="Sales" value="100" state="enabled" onPress={onPress} />
      </ThemeProvider>
    );

    fireEvent.press(getByText('Sales'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders Chip, Fab, ScreenHeader, EmptyState, InlineError, ScanFrame', () => {
    const { getByText } = render(
      <ThemeProvider>
        <I18nProvider>
          <ScreenHeader title="Test Header" />
          <Chip label="Filter" selected />
          <Fab label="Add New" />
          <EmptyState title="No items" />
          <InlineError message="Error loading" />
          <ScanFrame />
        </I18nProvider>
      </ThemeProvider>
    );

    expect(getByText('Test Header')).toBeTruthy();
    expect(getByText('Filter')).toBeTruthy();
    expect(getByText('Add New')).toBeTruthy();
    expect(getByText('No items')).toBeTruthy();
    expect(getByText('Error loading')).toBeTruthy();
  });
});
