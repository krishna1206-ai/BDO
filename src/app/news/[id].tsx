import { Stack, useLocalSearchParams } from 'expo-router';
import { Share, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ParallaxImage, PrimaryButton, Reveal, Tag, styles as ui, useScrollTracker } from '@/components/ui';
import { formatDate, news } from '@/data/content';
import { newsImage } from '@/data/images';
import { spacing } from '@/theme';

export default function NewsDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const index = news.findIndex((n) => n.id === id);
  const item = news[index];
  const { scrollY, onScroll } = useScrollTracker();

  if (!item) {
    return (
      <View style={ui.screen}>
        <Text style={ui.body}>Story not found.</Text>
      </View>
    );
  }

  return (
    <Animated.ScrollView contentContainerStyle={ui.screen} onScroll={onScroll} scrollEventThrottle={16}>
      <Stack.Screen options={{ title: item.category }} />
      <ParallaxImage source={newsImage(item, index)} scrollY={scrollY} />
      <Reveal index={0}>
        <Tag label={item.category} />
        <Text style={[ui.h1, { marginTop: spacing.sm }]}>{item.title}</Text>
        <Text style={[ui.muted, { marginTop: spacing.sm }]}>{formatDate(item.date)}</Text>
      </Reveal>
      <Reveal index={1}>
        <Text style={[ui.body, { fontWeight: '600', marginTop: spacing.lg }]}>{item.excerpt}</Text>
      </Reveal>
      {item.body.map((p, i) => (
        <Reveal key={i} index={i + 2}>
          <Text style={[ui.body, { marginTop: spacing.md }]}>{p}</Text>
        </Reveal>
      ))}
      <View style={{ marginTop: spacing.xl }}>
        <PrimaryButton
          label="Share story"
          icon="share-social-outline"
          onPress={() => Share.share({ message: `${item.title} — ${item.excerpt}` })}
        />
      </View>
    </Animated.ScrollView>
  );
}
