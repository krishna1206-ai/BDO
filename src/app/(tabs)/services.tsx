import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Card, CardImage, ScrollRevealProvider, styles as ui, useReplayKey, useScrollTracker } from '@/components/ui';
import { services } from '@/data/content';
import { serviceImages } from '@/data/images';
import { colors, spacing } from '@/theme';

export default function ServicesScreen() {
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();

  return (
    <ScrollRevealProvider value={scrollY}>
      <Animated.FlatList
        key={replayKey}
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={ui.screen}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <Text style={[ui.muted, { marginBottom: spacing.md, fontSize: 15 }]}>
            Specialist support across every stage of your business journey.
          </Text>
        }
        renderItem={({ item, index }) => (
          <Card
            index={index}
            style={{ marginBottom: spacing.md, overflow: 'hidden' }}
            onPress={() => router.push(`/service/${item.id}`)}
          >
            <CardImage source={serviceImages[item.id]} height={150} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.text }}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
            <Text style={[ui.body, { marginTop: spacing.sm, color: colors.textMuted }]}>{item.summary}</Text>
          </Card>
        )}
      />
    </ScrollRevealProvider>
  );
}
