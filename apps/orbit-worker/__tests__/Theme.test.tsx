import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { useElevation } from '../src/theme/useElevation';

function TestComponent() {
  const { theme, setTheme, colors } = useTheme();
  const raisedStyle = useElevation('raised');

  return (
    <>
      <Text testID="theme-text">{theme}</Text>
      <Text testID="color-text">{colors.surfaceStrong}</Text>
      <TouchableOpacity testID="toggle-btn" onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        <Text>Toggle</Text>
      </TouchableOpacity>
    </>
  );
}

describe('Theme System & Elevation', () => {
  it('defaults to dark theme and persists/switches correctly', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('theme-text').props.children).toBe('dark');
    expect(getByTestId('color-text').props.children).toBe('#121815');

    fireEvent.press(getByTestId('toggle-btn'));

    expect(getByTestId('theme-text').props.children).toBe('light');
    expect(getByTestId('color-text').props.children).toBe('#EDF1F3');
  });
});
