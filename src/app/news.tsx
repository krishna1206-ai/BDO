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
import { formatDate, news } from '@/data/content';
import { newsImage } from '@/data/images';
import { colors, radius, spacing } from '@/theme';

const years = ['All', ...Array.from(new Set(news.map((n) => n.date.slice(0, 4)))).sort().reverse()];

export default function NewsScreen() {
  const [year, setYear] = useState('All');
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();

  const data = useMemo(
    () =>
      news
        .map((item, i) => ({ item, image: newsImage(item, i) }))
        .filter(({ item }) => year === 'All' || item.date.startsWith(year))
        .sort((a, b) => b.item.date.localeCompare(a.item.date)),
    [year],
  );

  return (
    <ScrollRevealProvider value={scrollY}>
      <Animated.FlatList
        key={replayKey}
        data={data}
        keyExtractor={({ item }) => item.id}
        contentContainerStyle={ui.screen}
        itemLayoutAnimation={LinearTransition.springify().damping(18)}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            {years.map((y) => (
              <PressableScale key={y} scaleTo={0.92} onPress={() => setYear(y)} style={[s.chip, year === y && s.chipActive]}>
                <Text style={[s.chipText, year === y && { color: colors.onPrimary }]}>{y}</Text>
              </PressableScale>
            ))}
          </ScrollView>
        }
        renderItem={({ item: { item, image }, index }) => (
          <Card
            index={index}
            style={{ marginBottom: spacing.md, overflow: 'hidden' }}
            onPress={() => router.push(`/news/${item.id}`)}
          >
            <CardImage source={image} height={150} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag label={item.category} />
              <Text style={ui.muted}>{formatDate(item.date)}</Text>
            </View>
            <Text style={s.title}>{item.title}</Text>
            <Text style={[ui.body, { color: colors.textMuted }]}>{item.excerpt}</Text>
          </Card>
        )}
      />
    </ScrollRevealProvider>
  );
}

const s = StyleSheet.create({
  chips: { gap: spacing.sm, paddingBottom: spacing.md },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontWeight: '600', color: colors.text },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, marginVertical: 6 },
});
