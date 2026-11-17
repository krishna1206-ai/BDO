import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { ReduceMotion, ZoomIn } from 'react-native-reanimated';

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
import { events, formatDate } from '@/data/content';
import { eventImages } from '@/data/images';
import { useAuth } from '@/lib/auth';
import { cancelEventRegistration, myEventRegistrations, registerForEvent } from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

export default function EventsScreen() {
  const { user } = useAuth();
  const [registered, setRegistered] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();

  // Load this user's saved registrations from the "event_registrations" table.
  useEffect(() => {
    let active = true;
    myEventRegistrations()
      .then((ids) => active && setRegistered(ids))
      .catch(() => {
        // Not fatal: buttons still work and errors are shown when the user taps one.
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = async (id: string, title: string) => {
    if (pending) return;
    const wasRegistered = registered.has(id);
    setPending(id);
    try {
      if (wasRegistered) {
        await cancelEventRegistration(id);
      } else {
        await registerForEvent({ eventId: id, eventTitle: title, fullName: user?.name ?? '', email: user?.email ?? '' });
        Alert.alert('You are registered', `We will send joining details for “${title}” to ${user?.email ?? 'your email'}.`);
      }
      setRegistered((prev) => {
        const next = new Set(prev);
        if (wasRegistered) next.delete(id);
        else next.add(id);
        return next;
      });
    } catch (e) {
      Alert.alert('Something went wrong', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setPending(null);
    }
  };

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ScrollRevealProvider value={scrollY}>
    <Animated.FlatList
      key={replayKey}
      data={sorted}
      keyExtractor={(item) => item.id}
      contentContainerStyle={ui.screen}
      onScroll={onScroll}
      scrollEventThrottle={16}
      renderItem={({ item, index }) => {
        const isRegistered = registered.has(item.id);
        return (
          <Card index={index} style={{ marginBottom: spacing.md, overflow: 'hidden' }}>
            <CardImage source={eventImages[item.format]} height={130} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag label={item.format} />
              <Text style={s.date}>{formatDate(item.date)}</Text>
            </View>
            <Text style={s.title}>{item.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={ui.muted}>{item.location}</Text>
            </View>
            <Text style={[ui.body, { marginTop: spacing.sm, color: colors.textMuted }]}>{item.description}</Text>
            <PressableScale
              onPress={() => toggle(item.id, item.title)}
              style={[s.button, isRegistered && s.buttonDone]}
            >
              {/* Keyed so the label pops in each time the state flips. */}
              <Animated.Text
                key={String(isRegistered)}
                entering={ZoomIn.duration(220).reduceMotion(ReduceMotion.System)}
                style={[s.buttonText, isRegistered && { color: colors.primary }]}
              >
                {pending === item.id ? 'Saving…' : isRegistered ? '✓ Registered (tap to cancel)' : 'Register'}
              </Animated.Text>
            </PressableScale>
          </Card>
        );
      }}
    />
    </ScrollRevealProvider>
  );
}

const s = StyleSheet.create({
  date: { fontWeight: '700', color: colors.accent, fontSize: 13 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, marginVertical: 6 },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  buttonDone: { backgroundColor: '#E8EEF6' },
  buttonText: { color: colors.onPrimary, fontWeight: '700' },
});
