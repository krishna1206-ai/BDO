import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { PrimaryButton, Reveal, styles as ui } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactScreen() {
  const params = useLocalSearchParams<{ service?: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [topic, setTopic] = useState(params.service ?? '');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Please enter your name.';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Please enter a valid email address.';
    if (message.trim().length < 10) next.message = 'Please tell us a little more (at least 10 characters).';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Demo only: in a real app, send this to your backend or CRM here.
    Alert.alert('Thank you', `Thanks ${name.trim()}, an adviser will be in touch within one working day.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={ui.screen} keyboardShouldPersistTaps="handled">
        <Reveal index={0}>
          <Text style={ui.h1}>How can we help?</Text>
          <Text style={[ui.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
            Send us a few details and the right specialist will get back to you.
          </Text>
        </Reveal>

        <Field index={1} label="Full name *" value={name} onChangeText={setName} error={errors.name} autoComplete="name" />
        <Field
          index={2}
          label="Email *"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field index={3} label="Company" value={company} onChangeText={setCompany} />
        <Field index={4} label="Topic" value={topic} onChangeText={setTopic} placeholder="e.g. Tax, Audit, Selling my business" />
        <Field index={5} label="Message *" value={message} onChangeText={setMessage} error={errors.message} multiline />

        <Reveal index={6} style={{ marginTop: spacing.lg }}>
          <PrimaryButton label="Send enquiry" icon="send-outline" onPress={submit} />
        </Reveal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = ComponentProps<typeof TextInput> & { label: string; error?: string; index: number };

function Field({ label, error, multiline, style, index, ...rest }: FieldProps) {
  return (
    <Reveal index={index} style={{ marginTop: spacing.md }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        {...rest}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
        style={[s.input, multiline && s.multiline, error ? s.inputError : null, style]}
      />
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
    </Reveal>
  );
}

const s = StyleSheet.create({
  label: { fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  inputError: { borderColor: '#D33' },
  error: { color: '#D33', marginTop: 4, fontSize: 13 },
});
