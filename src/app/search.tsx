import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, styles as ui } from '@/components/ui';
import { industries, insights, news, offices, services } from '@/data/content';
import { topics } from '@/data/nav';
import { colors, spacing } from '@/theme';

type Result = { key: string; kind: string; title: string; text: string; href: Href };

const index: Result[] = [
  ...services.map((s) => ({ key: `s-${s.id}`, kind: 'Service', title: s.title, text: s.summary, href: `/service/${s.id}` as Href })),
  ...topics.map((x) => ({ key: `t-${x.id}`, kind: 'Page', title: x.title, text: x.summary, href: `/topic/${x.id}` as Href })),
  ...industries.map((i) => ({ key: `i-${i.id}`, kind: 'Industry', title: i.title, text: i.summary, href: `/industry/${i.id}` as Href })),
  ...insights.map((i) => ({
    key: `in-${i.id}`,
    kind: i.report ? 'Report' : 'Insight',
    title: i.title,
    text: i.excerpt,
    href: `/insight/${i.id}` as Href,
  })),
  ...news.map((n) => ({ key: `n-${n.id}`, kind: 'News', title: n.title, text: n.excerpt, href: `/news/${n.id}` as Href })),
  ...offices.map((o) => ({ key: `o-${o.city}`, kind: 'Office', title: `${o.city} office`, text: o.address, href: '/offices' as Href })),
];

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');

  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    return index
      .map((r) => {
        const hay = `${r.title} ${r.text}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return null;
        // Title matches rank above body matches.
        const score = words.reduce((sum, w) => sum + (r.title.toLowerCase().includes(w) ? 2 : 1), 0);
        return { r, score };
      })
      .filter((x): x is { r: Result; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.r);
  }, [query]);

  return (
    <FlatList
      data={results}
      keyExtractor={(r) => r.key}
      contentContainerStyle={ui.screen}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          <View style={s.box}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search services, industries, insights…"
              placeholderTextColor={colors.textMuted}
              style={s.input}
              autoFocus
              returnKeyType="search"
              autoCorrect={false}
            />
          </View>
          {query.trim() ? (
            <Text style={[ui.muted, { marginBottom: spacing.sm }]}>
              {results.length} result{results.length === 1 ? '' : 's'}
            </Text>
          ) : (
            <Text style={ui.muted}>Try “tax”, “cyber”, “healthcare” or “Manchester”.</Text>
          )}
        </>
      }
      renderItem={({ item, index: i }) => (
        <Card index={i} style={{ marginBottom: spacing.sm }} onPress={() => router.push(item.href)}>
          <Text style={s.kind}>{item.kind}</Text>
          <Text style={s.title}>{item.title}</Text>
          <Text style={ui.muted} numberOfLines={2}>
            {item.text}
          </Text>
        </Card>
      )}
    />
  );
}

const s = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text },
  kind: { fontSize: 12, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginVertical: 4 },
});
