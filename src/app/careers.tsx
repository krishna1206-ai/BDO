import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { Image } from 'expo-image';

import {
  Card,
  PressableScale,
  Reveal,
  ScrollRevealProvider,
  Tag,
  styles as ui,
  useReplayKey,
  useScrollTracker,
} from '@/components/ui';
import { jobs, type Job } from '@/data/content';
import { careersImage } from '@/data/images';
import { colors, radius, spacing } from '@/theme';

const types: ('All' | Job['type'])[] = ['All', 'Graduate', 'Internship', 'Experienced'];

export default function CareersScreen() {
  const [type, setType] = useState<(typeof types)[number]>('All');
  const data = jobs.filter((j) => type === 'All' || j.type === type);
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();

  return (
    <ScrollRevealProvider value={scrollY}>
    <Animated.FlatList
      key={replayKey}
      data={data}
      keyExtractor={(item) => item.id}
      itemLayoutAnimation={LinearTransition.springify().damping(18)}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={ui.screen}
      ListHeaderComponent={
        <View>
          <Reveal index={0}>
            <Image source={careersImage} style={s.banner} contentFit="cover" transition={250} />
          </Reveal>
          <Text style={ui.h1}>Build your career with us</Text>
          <Text style={[ui.body, { color: colors.textMuted, marginVertical: spacing.sm }]}>
            Join a team that works with entrepreneurial businesses across the UK.
          </Text>
          <View style={s.chips}>
            {types.map((t) => (
              <PressableScale key={t} scaleTo={0.92} onPress={() => setType(t)} style={[s.chip, type === t && s.chipActive]}>
                <Text style={[s.chipText, type === t && { color: colors.onPrimary }]}>{t}</Text>
              </PressableScale>
            ))}
          </View>
        </View>
      }
      renderItem={({ item, index }) => (
        <Card
          index={index}
          style={{ marginBottom: spacing.sm }}
          onPress={() => router.push({ pathname: '/contact', params: { service: `Careers: ${item.title}` } })}
        >
          <Tag label={item.type} />
          <Text style={s.title}>{item.title}</Text>
          <Text style={ui.muted}>
            {item.team} · {item.location}
          </Text>
          <Text style={s.apply}>Apply now →</Text>
        </Card>
      )}
    />
    </ScrollRevealProvider>
  );
}

const s = StyleSheet.create({
  banner: { height: 170, borderRadius: radius.md, marginBottom: spacing.md, backgroundColor: '#E8EEF6' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontWeight: '600', color: colors.text },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginVertical: 6 },
  apply: { color: colors.accent, fontWeight: '700', marginTop: spacing.sm },
});
