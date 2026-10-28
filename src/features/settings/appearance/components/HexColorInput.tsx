import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import { controlSize, spacing, typography } from '@/constants/design';
import { mix } from '@/features/theme/color';
import { useRadius } from '@/features/theme/useRadius';
import { useTheme } from '@/features/theme/useTheme';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

/** Keep incomplete edits local: only a submitted, opaque HEX enters the theme. */
export function HexColorInput({ label, value, onChange }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const rad = useRadius();
  const canonical = mix(value, value, 0).toUpperCase();
  const [draft, setDraft] = useState(canonical);
  const [invalid, setInvalid] = useState(false);

  // A panel gesture, preset or reset must also update the editable value.
  useEffect(() => {
    setDraft(canonical);
    setInvalid(false);
  }, [canonical]);

  const apply = () => {
    const digits = draft.trim().replace(/^#/, '');
    if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(digits)) {
      setInvalid(true);
      return;
    }
    const hex = '#' + (digits.length === 3 ? digits.split('').map(c => c + c).join('') : digits).toUpperCase();
    setDraft(hex);
    setInvalid(false);
    if (hex !== canonical) onChange(hex);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.secondary }]}>{t('settings.appearance.color.hex')}</Text>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={t('settings.appearance.color.hexLabel', { name: label })}
          accessibilityHint={t('settings.appearance.color.hexHint')}
          value={draft}
          onChangeText={text => { setDraft(text); setInvalid(false); }}
          onSubmitEditing={apply}
          autoCapitalize="characters"
          autoCorrect={false}
          spellCheck={false}
          selectTextOnFocus
          returnKeyType="done"
          placeholder="#RRGGBB"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, {
            color: colors.text,
            backgroundColor: colors.muted,
            borderColor: invalid ? colors.error : colors.border,
            borderRadius: rad.md,
          }]}
        />
        <Touchable
          accessibilityRole="button"
          onPress={apply}
          style={[styles.apply, { backgroundColor: colors.muted, borderRadius: rad.md }]}
        >
          <Text style={[styles.label, { color: colors.secondary }]}>{t('settings.appearance.color.apply')}</Text>
        </Touchable>
      </View>
      {invalid && <Text accessibilityRole="alert" style={[styles.label, { color: colors.error }]}>{t('settings.appearance.color.invalidHex')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { ...typography.caption },
  input: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    minHeight: controlSize.minimumTarget,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  apply: { minHeight: controlSize.minimumTarget, justifyContent: 'center', paddingHorizontal: spacing.md },
});
