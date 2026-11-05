import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Card, CardImage, ScrollRevealProvider, styles as ui, useReplayKey, useScrollTracker } from '@/components/ui';
import { offices } from '@/data/content';
import { officeImage } from '@/data/images';
import { colors, spacing } from '@/theme';

export default function OfficesScreen() {
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();

  return (
    <ScrollRevealProvider value={scrollY}>
      <Animated.FlatList
        key={replayKey}
        data={offices}
        keyExtractor={(item) => item.city}
        contentContainerStyle={ui.screen}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <Card index={index} style={{ marginBottom: spacing.sm, overflow: 'hidden' }}>
            <CardImage source={officeImage(item.city, index)} height={130} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{item.city}</Text>
            <Text style={[ui.muted, { marginTop: 4 }]}>{item.address}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md }}>
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                onPress={() => Linking.openURL(`tel:${item.phone.replace(/\s/g, '')}`)}
              >
                <Ionicons name="call-outline" size={16} color={colors.accent} />
                <Text style={{ color: colors.accent, fontWeight: '600' }}>{item.phone}</Text>
              </Pressable>
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(item.address)}`)}
              >
                <Ionicons name="map-outline" size={16} color={colors.accent} />
                <Text style={{ color: colors.accent, fontWeight: '600' }}>Map</Text>
              </Pressable>
            </View>
          </Card>
        )}
      />
    </ScrollRevealProvider>
  );
}
