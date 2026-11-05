import { Stack, useLocalSearchParams } from 'expo-router';
import { Share, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ParallaxImage, PrimaryButton, Reveal, Tag, styles as ui, useScrollTracker } from '@/components/ui';
import { formatDate, insights } from '@/data/content';
import { insightImage } from '@/data/images';
import { spacing } from '@/theme';

export default function InsightDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insight = insights.find((i) => i.id === id);
  const { scrollY, onScroll } = useScrollTracker();

  if (!insight) {
    return (
      <View style={ui.screen}>
        <Text style={ui.body}>Article not found.</Text>
      </View>
    );
  }

  return (
    <Animated.ScrollView contentContainerStyle={ui.screen} onScroll={onScroll} scrollEventThrottle={16}>
      <Stack.Screen options={{ title: insight.category }} />
      <ParallaxImage source={insightImage(insight)} scrollY={scrollY} />
      <Reveal index={0}>
        <Tag label={insight.category} />
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
