import React, { type ReactNode } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { ThemePalette } from './ThemePalette';
import settingsAppearanceReducer, { selectActiveTheme, setThemeMode } from '../state';
import { contrast } from '@/features/theme/color';
import { DEFAULT_THEME, derivePalette } from '@/features/theme/presets';

// Names in labels, so each colour row can be found by what it is.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { name?: string }) => (opts?.name ? `${key}:${opts.name}` : key),
  }),
}));

// The picker is native drawing; what it reports is what matters here, so the
// stand-in hands back whatever colour a test passes through `pick`.
let mockPick: ((hex: string) => void) | null = null;
const pick = (hex: string) => act(async () => { mockPick!(hex); });
jest.mock('reanimated-color-picker', () => {
  const ColorPicker = ({ onCompleteJS, children }: { onCompleteJS: (c: { hex: string }) => void; children?: React.ReactNode }) => {
    mockPick = hex => onCompleteJS({ hex });
    return children ?? null;
  };
  return { __esModule: true, default: ColorPicker, Panel1: () => null, HueSlider: () => null };
});

function renderCard() {
  const store = configureStore({ reducer: { settingsAppearance: settingsAppearanceReducer } });
  store.dispatch(setThemeMode('light'));
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  Wrapper.displayName = 'TestStoreWrapper';
  return { store, view: render(<ThemePalette />, { wrapper: Wrapper }) };
}

const row = (key: string) => `settings.appearance.palette.${key}`;

describe('ThemePalette', () => {
  it('saves a typed background in the current scheme through the same palette guard', async () => {
    const { store, view } = renderCard();
    const screen = await view;
    await fireEvent.press(screen.getByText(row('background')));
    await fireEvent.changeText(screen.getByLabelText('settings.appearance.color.hexLabel:settings.appearance.palette.background'), '#232136');
    await fireEvent.press(screen.getByText('settings.appearance.color.apply'));
    const theme = selectActiveTheme(store.getState());
    expect(theme.palettes.light.background.toUpperCase()).toBe('#232136');
    expect(theme.palettes.light).toEqual(derivePalette({
      background: '#232136', surface: DEFAULT_THEME.palettes.light.card, text: DEFAULT_THEME.palettes.light.text,
    }));
    expect(theme.palettes.dark).toEqual(DEFAULT_THEME.palettes.dark);
  });

  it('edits the colours of the scheme on screen, and keeps text readable', async () => {
    const { store, view } = renderCard();
    const screen = await view;

    // Near-white text on a near-white background is what the guard is for.
    await fireEvent.press(screen.getByText(row('background')));
    await pick('#fafafa');
    await fireEvent.press(screen.getByText(row('text')));
    await pick('#f0f0f0');

    const theme = selectActiveTheme(store.getState());
    expect(theme.palettes.light.background).toBe('#fafafa');
    expect(contrast(theme.palettes.light.text, '#fafafa')).toBeGreaterThanOrEqual(4.5);
    expect(theme.palettes.dark).toEqual(DEFAULT_THEME.palettes.dark);
  });

  it('offers a reset only once the colours have changed', async () => {
    const { store, view } = renderCard();
    const screen = await view;
    expect(screen.queryByText('settings.appearance.palette.reset')).toBeNull();

    await fireEvent.press(screen.getByText(row('surface')));
    await pick('#eeeeee');
    await fireEvent.press(screen.getByText('settings.appearance.palette.reset'));

    expect(selectActiveTheme(store.getState()).palettes).toEqual(DEFAULT_THEME.palettes);
  });
});
