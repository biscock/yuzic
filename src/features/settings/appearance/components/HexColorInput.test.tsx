import React from 'react';
import { fireEvent, render as renderNative } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { HexColorInput } from './HexColorInput';
import settingsAppearanceReducer from '../state';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const inputLabel = 'settings.appearance.color.hexLabel';
const applyLabel = 'settings.appearance.color.apply';

function render(ui: React.ReactElement) {
  const store = configureStore({ reducer: { settingsAppearance: settingsAppearanceReducer } });
  return renderNative(ui, {
    wrapper: function TestStore({ children }) { return <Provider store={store}>{children}</Provider>; },
  });
}

describe('HexColorInput', () => {
  it('accepts a pasted HEX without # and applies it only on submission', async () => {
    const onChange = jest.fn();
    const screen = await render(<HexColorInput label="Accent" value="#fff" onChange={onChange} />);
    const input = screen.getByLabelText(inputLabel);
    expect(input.props.value).toBe('#FFFFFF');
    await fireEvent.changeText(input, '  c4a7e7  ');
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText(applyLabel));
    expect(onChange).toHaveBeenCalledWith('#C4A7E7');
    expect(screen.getByLabelText(inputLabel).props.value).toBe('#C4A7E7');
  });

  it('accepts shorthand through the keyboard and does not repeat unchanged writes', async () => {
    const onChange = jest.fn();
    const screen = await render(<HexColorInput label="Text" value="#000" onChange={onChange} />);
    await fireEvent.changeText(screen.getByLabelText(inputLabel), '#abc');
    await fireEvent(screen.getByLabelText(inputLabel), 'submitEditing');
    expect(onChange).toHaveBeenCalledWith('#AABBCC');
    await screen.rerender(<HexColorInput label="Text" value="#aabbcc" onChange={onChange} />);
    await fireEvent.press(screen.getByText(applyLabel));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it.each(['', '#12', '#GGGGGG', '#12345678', 'red'])('keeps invalid input %p out of the theme', async draft => {
    const onChange = jest.fn();
    const screen = await render(<HexColorInput label="Background" value="#232136" onChange={onChange} />);
    await fireEvent.changeText(screen.getByLabelText(inputLabel), draft);
    await fireEvent.press(screen.getByText(applyLabel));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText(inputLabel), '#2a273f');
    expect(screen.queryByRole('alert')).toBeNull();
    await fireEvent.press(screen.getByText(applyLabel));
    expect(onChange).toHaveBeenCalledWith('#2A273F');
  });

  it('reflects a picker or reset changing the saved colour, clearing stale errors', async () => {
    const onChange = jest.fn();
    const screen = await render(<HexColorInput label="Cards" value="#fff" onChange={onChange} />);
    await fireEvent.changeText(screen.getByLabelText(inputLabel), 'oops');
    await fireEvent.press(screen.getByText(applyLabel));
    await screen.rerender(<HexColorInput label="Cards" value="#2a273f" onChange={onChange} />);
    expect(screen.getByLabelText(inputLabel).props.value).toBe('#2A273F');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
