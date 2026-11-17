import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ParallaxImage, PressableScale, PrimaryButton, Reveal, Tag, styles as ui, useScrollTracker } from '@/components/ui';
import { formatDate, insights } from '@/data/content';
import { insightImage } from '@/data/images';
import { isInsightSaved, setInsightSaved } from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

export default function InsightDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insight = insights.find((i) => i.id === id);
  const { scrollY, onScroll } = useScrollTracker();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Whether this article is in the user's "saved_insights".
  useEffect(() => {
    if (!id) return;
    let active = true;
    isInsightSaved(id)
      .then((v) => active && setSaved(v))
      .catch(() => {
        // Not fatal: the button still works and reports errors when tapped.
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (!insight) {
    return (
      <View style={ui.screen}>
        <Text style={ui.body}>Article not found.</Text>
      </View>
    );
  }

  const toggleSaved = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setInsightSaved(insight.id, !saved);
      setSaved(!saved);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Animated.ScrollView contentContainerStyle={ui.screen} onScroll={onScroll} scrollEventThrottle={16}>
      <Stack.Screen options={{ title: insight.category }} />
      <ParallaxImage source={insightImage(insight)} scrollY={scrollY} />
      <Reveal index={0}>
        <View style={s.headRow}>
          <Tag label={insight.category} />
          <PressableScale
            onPress={toggleSaved}
            disabled={saving}
            scaleTo={0.92}
            style={[s.saveBtn, saved && s.saveBtnOn]}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Remove from saved' : 'Save article'}
          >
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? colors.onPrimary : colors.primary} />
            <Text style={[s.saveText, saved && { color: colors.onPrimary }]}>{saving ? '…' : saved ? 'Saved' : 'Save'}</Text>
          </PressableScale>
        </View>
        <Text style={[ui.h1, { marginTop: spacing.sm }]}>{insight.title}</Text>
        <Text style={[ui.muted, { marginTop: spacing.sm }]}>
          {formatDate(insight.date)} · {insight.readMinutes} min read
        </Text>
      </Reveal>
      <Reveal index={1}>
        <Text style={[ui.body, { fontWeight: '600', marginTop: spacing.lg }]}>{insight.excerpt}</Text>
      </Reveal>
      {insight.body.map((p, i) => (
        <Reveal key={i} index={i + 2}>
          <Text style={[ui.body, { marginTop: spacing.md }]}>{p}</Text>
        </Reveal>
      ))}
      <View style={{ marginTop: spacing.xl }}>
        <PrimaryButton
          label="Share article"
          icon="share-social-outline"
          onPress={() => Share.share({ message: `${insight.title} — ${insight.excerpt}` })}
        />
      </View>
    </Animated.ScrollView>
  );
}

const s = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saveBtnOn: { backgroundColor: colors.primary },
  saveText: { fontWeight: '700', color: colors.primary },
});
