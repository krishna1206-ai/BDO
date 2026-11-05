import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import {
  Card,
  ParallaxImage,
  PressableScale,
  PrimaryButton,
  ProgressBar,
  Reveal,
  styles as ui,
  useScrollTracker,
} from '@/components/ui';
import { cyberQuestions } from '@/data/content';
import { cyberImage } from '@/data/images';
import { colors, radius, spacing } from '@/theme';

type Answer = 0 | 1 | 2;
const options: { label: string; value: Answer }[] = [
  { label: 'Yes', value: 2 },
  { label: 'Partly', value: 1 },
  { label: 'No', value: 0 },
];

const maxScore = cyberQuestions.reduce((sum, q) => sum + q.weight * 2, 0);

function band(score: number) {
  if (score >= 0.8) return { label: 'Strong', color: '#1E8E5A', text: 'Your basics are in good shape. Keep testing them regularly.' };
  if (score >= 0.5) return { label: 'Developing', color: '#D98E04', text: 'Some important gaps remain. Fixing them would significantly cut your risk.' };
  return { label: 'At risk', color: '#D33A2C', text: 'You are exposed to common attacks. We recommend acting on the points below soon.' };
}

export default function CyberCheckScreen() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const { scrollY, onScroll } = useScrollTracker();

  const answered = Object.keys(answers).length;
  const done = answered === cyberQuestions.length;
  const score = cyberQuestions.reduce((sum, q) => sum + q.weight * (answers[q.id] ?? 0), 0) / maxScore;
  const result = band(score);
  const gaps = cyberQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== 2);

  return (
    <Animated.ScrollView contentContainerStyle={ui.screen} onScroll={onScroll} scrollEventThrottle={16}>
      <ParallaxImage source={cyberImage} scrollY={scrollY} height={180} />
      <Reveal index={0}>
        <Text style={ui.h1}>Cyber Risk Check</Text>
        <Text style={[ui.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
          Six quick questions about the controls that stop the most common attacks. Nothing you enter leaves this device.
        </Text>
      </Reveal>

      <Reveal index={1} style={{ marginTop: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={ui.muted}>Progress</Text>
          <Text style={[ui.muted, { fontWeight: '700' }]}>
            {answered} / {cyberQuestions.length}
          </Text>
        </View>
        <ProgressBar value={answered / cyberQuestions.length} color={colors.primary} />
      </Reveal>

      {cyberQuestions.map((q, i) => (
        <Card key={q.id} index={i + 2} style={{ marginTop: spacing.md }}>
          <Text style={s.qNumber}>Question {i + 1}</Text>
          <Text style={s.question}>{q.question}</Text>
          <View style={s.options}>
            {options.map((o) => {
              const selected = answers[q.id] === o.value;
              return (
                <PressableScale
                  key={o.label}
                  scaleTo={0.94}
                  onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: o.value }))}
                  style={[s.option, selected && s.optionSelected]}
                >
                  <Text style={[s.optionText, selected && { color: colors.onPrimary }]}>{o.label}</Text>
                </PressableScale>
              );
            })}
          </View>
        </Card>
      ))}

      {done ? (
        <Animated.View
          entering={FadeInDown.duration(450).reduceMotion(ReduceMotion.System)}
          layout={LinearTransition}
          style={s.result}
        >
          <Text style={s.resultLabel}>Your result</Text>
          <Text style={[s.resultBand, { color: result.color }]}>
            {result.label} · {Math.round(score * 100)}%
          </Text>
          <View style={{ marginVertical: spacing.sm }}>
            <ProgressBar value={score} color={result.color} delay={200} />
          </View>
          <Text style={ui.body}>{result.text}</Text>

          {gaps.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[ui.body, { fontWeight: '700' }]}>Where to focus</Text>
              {gaps.map((g) => (
                <View key={g.id} style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  <Ionicons name="alert-circle-outline" size={18} color={result.color} />
                  <Text style={[ui.body, { flex: 1 }]}>{g.help}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <PrimaryButton
              label="Talk to a cyber specialist"
              icon="shield-checkmark-outline"
              onPress={() => router.push({ pathname: '/contact', params: { service: 'Cybersecurity' } })}
            />
            <PressableScale onPress={() => setAnswers({})} style={s.reset}>
              <Text style={s.resetText}>Start again</Text>
            </PressableScale>
          </View>
        </Animated.View>
      ) : null}
    </Animated.ScrollView>
  );
}

const s = StyleSheet.create({
  qNumber: { fontSize: 12, fontWeight: '700', color: colors.accent, letterSpacing: 1, textTransform: 'uppercase' },
  question: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4, lineHeight: 22 },
  options: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontWeight: '700', color: colors.text },
  result: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  resultLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  resultBand: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  reset: { paddingVertical: 12, alignItems: 'center' },
  resetText: { color: colors.primary, fontWeight: '700' },
});
