import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/index';

describe('Orbit Worker Foundation', () => {
  it('renders home screen text successfully', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Orbit Worker Home')).toBeTruthy();
  });
});
