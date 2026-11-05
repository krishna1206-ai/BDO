import { ScrollView, Text } from 'react-native';

import { Card, Reveal, styles as ui, useReplayKey } from '@/components/ui';
import { legalSections } from '@/data/content';
import { colors, spacing } from '@/theme';

export default function LegalScreen() {
  const replayKey = useReplayKey();
  return (
    <ScrollView key={replayKey} contentContainerStyle={ui.screen}>
      <Reveal index={0}>
        <Text style={ui.h1}>Legal, privacy & cookies</Text>
        <Text style={[ui.muted, { marginTop: spacing.sm, marginBottom: spacing.md }]}>Last updated 1 November 2026</Text>
      </Reveal>
      {legalSections.map((section, i) => (
        <Card key={section.title} index={i + 1} style={{ marginBottom: spacing.sm }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 }}>{section.title}</Text>
          <Text style={ui.body}>{section.body}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}
