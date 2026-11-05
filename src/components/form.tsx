import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { colors, radius, spacing } from '@/theme';

type FieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
  /** Adds a show/hide toggle and hides the text by default. */
  password?: boolean;
};

/** Labelled text input with an animated error message and optional show/hide password toggle. */
export function FormField({ label, error, password, style, ...rest }: FieldProps) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.inputWrap, focused && s.inputFocused, error ? s.inputError : null]}>
        <TextInput
          {...rest}
          secureTextEntry={password ? hidden : rest.secureTextEntry}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[s.input, style]}
        />
        {password ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={s.eye}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Animated.Text
          entering={FadeInDown.duration(200).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(150).reduceMotion(ReduceMotion.System)}
          layout={LinearTransition}
          style={s.error}
        >
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
}

/** Form-level message (e.g. "Incorrect email or password"). */
export function FormAlert({ message }: { message: string }) {
  return (
    <Animated.View entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)} style={s.alert}>
      <Ionicons name="alert-circle" size={18} color="#B42318" />
      <Text style={s.alertText}>{message}</Text>
    </Animated.View>
  );
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const s = StyleSheet.create({
  label: { fontWeight: '600', color: colors.text, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  inputFocused: { borderColor: colors.primaryLink },
  inputError: { borderColor: '#D33' },
  input: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.text },
  eye: { paddingHorizontal: spacing.md },
  error: { color: '#D33', marginTop: 4, fontSize: 13 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
  },
  alertText: { flex: 1, color: '#7A271A', fontSize: 14 },
});

/** Shared layout for the login and registration screens. */
export const authStyles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: 'center', padding: spacing.md, backgroundColor: colors.background },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.textMuted, marginTop: spacing.xs },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: spacing.lg },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.primaryLink, fontSize: 14, fontWeight: '700' },
});

