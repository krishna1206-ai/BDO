import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import {
  Card,
  CardImage,
  PressableScale,
  ScrollRevealProvider,
  Tag,
  styles as ui,
  useReplayKey,
  useScrollTracker,
} from '@/components/ui';
import { formatDate, insights, type Insight } from '@/data/content';
import { insightImage } from '@/data/images';
import { colors, radius, spacing } from '@/theme';

const filters: ('All' | 'Reports' | Insight['category'])[] = [
  'All',
  'Reports',
  'Tax',
  'Deals',
  'Risk',
  'Growth',
  'Audit',
  'Sustainability',
  'Digital',
];

export default function InsightsScreen() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();

  const data = useMemo(
    () =>
      insights
        .filter((i) => filter === 'All' || (filter === 'Reports' ? i.report : i.category === filter))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [filter],
  );

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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {filters.map((f) => (
            <PressableScale key={f} scaleTo={0.92} onPress={() => setFilter(f)} style={[s.chip, filter === f && s.chipActive]}>
              <Text style={[s.chipText, filter === f && s.chipTextActive]}>{f}</Text>
            </PressableScale>
          ))}
        </ScrollView>
      }
      ListEmptyComponent={<Text style={ui.muted}>No insights in this category yet.</Text>}
      renderItem={({ item, index }) => (
        <Card
          index={index}
          style={{ marginBottom: spacing.md, overflow: 'hidden' }}
          onPress={() => router.push(`/insight/${item.id}`)}
        >
          <CardImage source={insightImage(item)} height={150} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Tag label={item.category} />
            {item.report ? <Tag label="Report" /> : null}
          </View>
          <Text style={s.title}>{item.title}</Text>
          <Text style={[ui.body, { color: colors.textMuted }]}>{item.excerpt}</Text>
          <Text style={[ui.muted, { marginTop: spacing.sm }]}>
            {formatDate(item.date)} · {item.readMinutes} min read
          </Text>
        </Card>
      )}
    />
    </ScrollRevealProvider>
  );
}

const s = StyleSheet.create({
  chips: { gap: spacing.sm, paddingBottom: spacing.md },
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
  chipTextActive: { color: colors.onPrimary },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, marginVertical: 6 },
});
