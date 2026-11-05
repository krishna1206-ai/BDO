import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { EMAIL_RE, FormAlert, FormField, authStyles as s } from '@/components/form';
import { PressableScale, Reveal } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/theme';


/** Simple strength rules shown live under the password field. */
const rules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
  { label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
];

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Enter your full name.';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!rules.every((r) => r.test(password))) next.password = 'Choose a password that meets all the rules below.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    if (!agreed) next.agreed = 'Please accept the terms to continue.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await signUp({ name, email, company, password });
      router.replace('/');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled">
        <Reveal index={0} style={s.card}>
          <Text style={s.title}>Create an account</Text>
          <Text style={s.subtitle}>Register to save insights, book events and contact your adviser.</Text>

          {formError ? <FormAlert message={formError} /> : null}

          <FormField label="Full name" value={name} onChangeText={setName} error={errors.name} autoComplete="name" textContentType="name" />
          <FormField
            label="Work email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@company.com"
          />
          <FormField label="Company (optional)" value={company} onChangeText={setCompany} autoComplete="organization" />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            password
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <View style={{ marginTop: spacing.sm, gap: 4 }}>
            {rules.map((r) => {
              const ok = r.test(password);
              return (
                <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={ok ? '#1E8E5A' : colors.textMuted} />
                  <Text style={{ fontSize: 13, color: ok ? '#1E8E5A' : colors.textMuted }}>{r.label}</Text>
                </View>
              );
            })}
          </View>
          <FormField
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
            password
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          <Pressable
            onPress={() => setAgreed((a) => !a)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.md }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
          >
            <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={22} color={agreed ? colors.accent : colors.textMuted} />
            <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.text }}>
              I agree to the{' '}
              <Link href="/legal" style={s.link}>
                terms and privacy notice
              </Link>
              .
            </Text>
          </Pressable>
          {errors.agreed ? <Text style={{ color: '#D33', marginTop: 4, fontSize: 13 }}>{errors.agreed}</Text> : null}

          <PressableScale onPress={submit} disabled={busy} style={[s.button, busy && { opacity: 0.7 }]}>
            {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={s.buttonText}>Create account</Text>}
          </PressableScale>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <Link href="/login" replace style={s.link}>
              Log in
            </Link>
          </View>
        </Reveal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
