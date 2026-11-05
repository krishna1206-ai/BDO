import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Reveal, styles as ui, useReplayKey } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const tips = [
  'We will never ask you to change bank details by email alone. Always call us on a number you already know.',
  'We will never ask for passwords, PINs or one-time codes.',
  'Check sender addresses carefully. Fraudsters use addresses that look almost identical to ours.',
  'Be wary of urgent requests to pay, especially near deadlines such as the end of the tax year.',
  'If something feels wrong, stop. Do not click links or open attachments until you have checked.',
];

export default function FraudAlertScreen() {
  const replayKey = useReplayKey();
  return (
    <ScrollView key={replayKey} contentContainerStyle={ui.screen}>
      <Reveal index={0} style={s.alert}>
        <Ionicons name="warning" size={28} color="#B42318" />
        <View style={{ flex: 1 }}>
          <Text style={s.alertTitle}>Beware of scams using our name</Text>
          <Text style={s.alertText}>
            Criminals sometimes pretend to be professional firms to trick people into paying money or sharing personal details.
          </Text>
        </View>
      </Reveal>

      <Reveal index={1}>
        <Text style={[ui.h1, { fontSize: 20, marginTop: spacing.lg, marginBottom: spacing.sm }]}>How to protect yourself</Text>
      </Reveal>
      {tips.map((tip, i) => (
        <Card key={i} index={i + 2} style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
            <Text style={[ui.body, { flex: 1 }]}>{tip}</Text>
          </View>
        </Card>
      ))}

      <Reveal index={8} style={{ marginTop: spacing.lg }}>
        <Text style={[ui.body, { marginBottom: spacing.md }]}>
          If you think you have been contacted by someone pretending to be us, tell us straight away and report it to Action
          Fraud.
        </Text>
        <PrimaryButton
          label="Report a suspicious message"
          icon="flag-outline"
          onPress={() => router.push({ pathname: '/contact', params: { service: 'Fraud report' } })}
        />
      </Reveal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
  },
  alertTitle: { fontSize: 17, fontWeight: '800', color: '#B42318' },
  alertText: { fontSize: 14, lineHeight: 21, color: '#7A271A', marginTop: 4 },
});
