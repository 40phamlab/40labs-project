import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, Tab } from './Tabs';

describe('Tabs Component', () => {
  it('renders tabs with correct roles and variants', () => {
    render(
      <Tabs variant="line" size="md">
        <Tab label="Tab 1" value="tab1" active />
        <Tab label="Tab 2" value="tab2" />
        <Tab label="Tab 3" value="tab3" disabled />
      </Tabs>
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('aria-disabled', 'true');
    expect(tabs[2]).toBeDisabled();
  });

  it('supports controlled active state and onChange', async () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <Tabs value="tab1" onChange={handleChange}>
        <Tab label="Tab 1" value="tab1" />
        <Tab label="Tab 2" value="tab2" />
      </Tabs>
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(tabs[1]);
    expect(handleChange).toHaveBeenCalledWith('tab2');

    rerender(
      <Tabs value="tab2" onChange={handleChange}>
        <Tab label="Tab 1" value="tab1" />
        <Tab label="Tab 2" value="tab2" />
      </Tabs>
    );

    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('handles keyboard navigation (Arrow keys, Home, End) and skips disabled tabs', async () => {
    render(
      <Tabs defaultValue="tab1">
        <Tab label="Tab 1" value="tab1" />
        <Tab label="Tab 2" value="tab2" disabled />
        <Tab label="Tab 3" value="tab3" />
      </Tabs>
    );

    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    expect(tabs[0]).toHaveFocus();

    // Press ArrowRight -> should skip tab2 (disabled) and go to tab3
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(tabs[2]).toHaveFocus();
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');

    // Press ArrowLeft -> should skip tab2 and go to tab1
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });
    expect(tabs[0]).toHaveFocus();

    // Press End -> should go to tab3
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'End' });
    expect(tabs[2]).toHaveFocus();

    // Press Home -> should go to tab1
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Home' });
    expect(tabs[0]).toHaveFocus();
  });

  it('supports vertical orientation and arrow up/down', () => {
    render(
      <Tabs orientation="vertical" defaultValue="tab1">
        <Tab label="Tab 1" value="tab1" />
        <Tab label="Tab 2" value="tab2" />
      </Tabs>
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-orientation', 'vertical');

    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();

    fireEvent.keyDown(tablist, { key: 'ArrowDown' });
    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('supports RTL navigation', () => {
    render(
      <Tabs dir="rtl" defaultValue="tab1">
        <Tab label="Tab 1" value="tab1" />
        <Tab label="Tab 2" value="tab2" />
      </Tabs>
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('dir', 'rtl');

    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();

    // In RTL, ArrowLeft moves forward (to tab 2)
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    expect(tabs[1]).toHaveFocus();
  });
});
