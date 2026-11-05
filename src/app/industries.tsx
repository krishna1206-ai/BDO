import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Card, CardImage, ScrollRevealProvider, styles as ui, useReplayKey, useScrollTracker } from '@/components/ui';
import { industries } from '@/data/content';
import { industryImages } from '@/data/images';
import { colors, spacing } from '@/theme';

export default function IndustriesScreen() {
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();

  return (
    <ScrollRevealProvider value={scrollY}>
      <Animated.FlatList
        key={replayKey}
        data={industries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={ui.screen}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <Text style={[ui.body, { color: colors.textMuted, marginBottom: spacing.md }]}>
            Specialist teams who understand the pressures and opportunities in your sector.
          </Text>
        }
        renderItem={({ item, index }) => (
          <Card
            index={index}
            style={{ marginBottom: spacing.md, overflow: 'hidden' }}
            onPress={() => router.push(`/industry/${item.id}`)}
          >
            <CardImage source={industryImages[item.id]} height={140} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.text }}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
            <Text style={[ui.muted, { marginTop: 6, fontSize: 14 }]}>{item.summary}</Text>
          </Card>
        )}
      />
    </ScrollRevealProvider>
  );
}
