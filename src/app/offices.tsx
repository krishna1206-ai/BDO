import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Linking, Platform, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Card, CardImage, ScrollRevealProvider, styles as ui, useReplayKey, useScrollTracker } from '@/components/ui';
import { officeMapUrl, type Office } from '@/data/content';
import { officeImage } from '@/data/images';
import { useCatalog } from '@/lib/catalog';
import { colors, spacing } from '@/theme';

/** Opens a link in a new browser tab on the web, or the matching app (Maps, Phone) on phones. */
function open(url: string) {
  if (Platform.OS === 'web' && /^https?:/i.test(url)) window.open(url, '_blank', 'noopener,noreferrer');
  else Linking.openURL(url);
}

export default function OfficesScreen() {
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();
  const { offices, loaded } = useCatalog();

  return (
    <ScrollRevealProvider value={scrollY}>
      <Animated.FlatList<Office>
        key={replayKey}
        data={offices}
        keyExtractor={(item) => item.id ?? item.city}
        contentContainerStyle={ui.screen}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={
          loaded ? (
            <Text style={[ui.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg }]}>No offices listed yet.</Text>
          ) : (
            <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />
          )
        }
        renderItem={({ item, index }) => (
          <Card index={index} style={{ marginBottom: spacing.sm, overflow: 'hidden' }}>
            <CardImage source={item.image ? { uri: item.image } : officeImage(item.city, index)} height={130} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
              {item.city}
              {item.country ? <Text style={{ fontWeight: '600', color: colors.textMuted }}>, {item.country}</Text> : null}
            </Text>
            {item.address ? <Text style={[ui.muted, { marginTop: 4 }]}>{item.address}</Text> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.md }}>
              {item.phone ? (
                <Pressable
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  accessibilityRole="link"
                  accessibilityLabel={`Call ${item.city} office`}
                  onPress={() => open(`tel:${item.phone.replace(/[^\d+]/g, '')}`)}
                >
                  <Ionicons name="call-outline" size={16} color={colors.accent} />
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>{item.phone}</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                accessibilityRole="link"
                accessibilityLabel={`Open ${item.city} office on the map`}
                onPress={() => open(officeMapUrl(item))}
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
