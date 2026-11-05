import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import {
  Card,
  PressableScale,
  ScrollRevealProvider,
  styles as ui,
  useReplayKey,
  useScrollTracker,
} from '@/components/ui';
import { advisers } from '@/data/content';
import { colors, radius, spacing } from '@/theme';

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function AdvisersScreen() {
  const [query, setQuery] = useState('');
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return advisers;
    return advisers.filter((a) =>
      [a.name, a.role, a.speciality, a.office].some((field) => field.toLowerCase().includes(q)),
    );
  }, [query]);

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
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={s.search}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, service or office"
            placeholderTextColor={colors.textMuted}
            style={s.input}
            autoCorrect={false}
          />
        </View>
      }
      ListEmptyComponent={<Text style={ui.muted}>No advisers match “{query}”.</Text>}
      renderItem={({ item, index }) => (
        <Card index={index} style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(item.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={ui.muted}>
                {item.role} · {item.speciality}
              </Text>
              <Text style={ui.muted}>{item.office}</Text>
            </View>
          </View>
          <View style={s.actions}>
            <PressableScale style={s.action} scaleTo={0.94} onPress={() => Linking.openURL(`mailto:${item.email}`)}>
              <Ionicons name="mail-outline" size={16} color={colors.primary} />
              <Text style={s.actionText}>Email</Text>
            </PressableScale>
            <PressableScale
              style={s.action}
              scaleTo={0.94}
              onPress={() => Linking.openURL(`tel:${item.phone.replace(/\s/g, '')}`)}
            >
              <Ionicons name="call-outline" size={16} color={colors.primary} />
              <Text style={s.actionText}>Call</Text>
            </PressableScale>
          </View>
        </Card>
      )}
    />
    </ScrollRevealProvider>
  );
}

const s = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  action: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: '#E8EEF6',
  },
  actionText: { color: colors.primary, fontWeight: '600' },
});
