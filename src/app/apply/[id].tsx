import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { EMAIL_RE, FormAlert, FormField, authStyles as s } from '@/components/form';
import { PressableScale, Reveal, Tag, styles as ui } from '@/components/ui';
import { Image } from 'expo-image';

import { useAuth } from '@/lib/auth';
import { useCatalog } from '@/lib/catalog';
import { submitJobApplication } from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

/** Job application form; saves to the "job_applications" table in Supabase. */
export default function ApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jobs, loaded } = useCatalog();
  const job = jobs.find((j) => j.id === id);
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!job && !loaded) {
    return (
      <View style={[ui.screen, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={ui.screen}>
        <Text style={ui.body}>This role is no longer available.</Text>
      </View>
    );
  }

  const submit = async () => {
    if (busy) return;
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Enter your full name.';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (cvUrl.trim() && !/^https?:\/\/\S+$/i.test(cvUrl.trim())) next.cvUrl = 'Enter a full link starting with https://';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await submitJobApplication({ jobId: job.id, jobTitle: job.title, fullName: name, email, phone, cvUrl, message });
      setDone(true);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not send your application. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Apply' }} />
      <ScrollView contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled">
        <Reveal index={0} style={s.card}>
          {job.image ? (
            <Image
              source={{ uri: job.image }}
              style={{ height: 150, borderRadius: radius.sm, marginBottom: spacing.md, backgroundColor: '#E8EEF6' }}
              contentFit="cover"
              transition={250}
            />
          ) : null}
          <Tag label={job.type} />
          <Text style={[s.title, { marginTop: spacing.sm }]}>{job.title}</Text>
          <Text style={s.subtitle}>
            {job.team} · {job.location}
          </Text>
          {job.description ? <Text style={[ui.body, { marginTop: spacing.md }]}>{job.description}</Text> : null}

          {done ? (
            <>
              <FormAlert tone="success" message={`Thank you, ${name.trim()}. We have received your application and will be in touch.`} />
              <PressableScale onPress={() => router.replace('/careers')} style={s.button}>
                <Text style={s.buttonText}>Back to all roles</Text>
              </PressableScale>
            </>
          ) : (
            <>
              {formError ? <FormAlert message={formError} /> : null}
              <FormField label="Full name *" value={name} onChangeText={setName} error={errors.name} autoComplete="name" />
              <FormField
                label="Email *"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <FormField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
              <FormField
                label="Link to your CV (optional)"
                value={cvUrl}
                onChangeText={setCvUrl}
                error={errors.cvUrl}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://drive.google.com/…"
              />
              <FormField
                label="Why are you interested? (optional)"
                value={message}
                onChangeText={setMessage}
                multiline
                style={{ minHeight: 110, textAlignVertical: 'top' }}
              />

              <PressableScale onPress={submit} disabled={busy} style={[s.button, busy && { opacity: 0.7 }]}>
                {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={s.buttonText}>Submit application</Text>}
              </PressableScale>
            </>
          )}
        </Reveal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
