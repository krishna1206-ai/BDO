import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { EMAIL_RE, FormAlert, FormField, authStyles as s } from '@/components/form';
import { PressableScale, Reveal } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await signIn(email, password);
      if (router.canGoBack()) router.back();
      else router.replace('/');
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
          <Text style={s.title}>Log in</Text>
          <Text style={s.subtitle}>Access your client portal, saved insights and event bookings.</Text>

          {formError ? <FormAlert message={formError} /> : null}

          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@company.com"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            password
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          <PressableScale onPress={submit} disabled={busy} style={[s.button, busy && { opacity: 0.7 }]}>
            {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={s.buttonText}>Log in</Text>}
          </PressableScale>

          <View style={s.footer}>
            <Text style={s.footerText}>New here? </Text>
            <Link href="/register" replace style={s.link}>
              Create an account
            </Link>
          </View>
        </Reveal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

