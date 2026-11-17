import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { styles as ui } from '@/components/ui';
import { myNotifications, type NotificationRow } from '@/lib/db';
import { useNotifications } from '@/lib/notifications';
import { colors, radius, spacing } from '@/theme';

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** The signed-in user's notifications. Opening this screen marks them all as read. */
export default function NotificationsScreen() {
  const { markAllRead, latest } = useNotifications();
  const [items, setItems] = useState<NotificationRow[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load the list, then mark everything read (unread items keep their highlight for this visit).
  // Reloads when a new notification arrives live.
  useEffect(() => {
    let active = true;
    myNotifications()
      .then((rows) => {
        if (!active) return;
        setItems(rows);
        setError('');
        markAllRead().catch(() => {});
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Could not load notifications.'));
    return () => {
      active = false;
    };
  }, [markAllRead, latest]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      setItems(await myNotifications());
      await markAllRead();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load notifications.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <FlatList
      data={items ?? []}
      keyExtractor={(n) => String(n.id)}
      contentContainerStyle={ui.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <>
          <Text style={ui.h1}>Notifications</Text>
          <Text style={[ui.muted, { marginTop: 4, marginBottom: spacing.md }]}>
            Updates on your enquiries and job applications.
          </Text>
          {error ? <Text style={{ color: '#B42318', marginBottom: spacing.md }}>{error}</Text> : null}
          {!items && !error ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : null}
        </>
      }
      ListEmptyComponent={
        items ? (
          <View style={s.empty}>
            <Ionicons name="notifications-off-outline" size={36} color={colors.textMuted} />
            <Text style={[ui.muted, { marginTop: spacing.sm, textAlign: 'center' }]}>
              No notifications yet. We will let you know here when there is an update on your enquiry or application.
            </Text>
          </View>
        ) : undefined
      }
      renderItem={({ item, index }) => {
        const unread = !item.read_at;
        return (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).reduceMotion(ReduceMotion.System)}>
            <Pressable
              onPress={() => item.link && item.link !== '/notifications' && router.push(item.link as Href)}
              style={[s.card, unread && s.cardUnread]}
            >
              <View style={[s.icon, unread && { backgroundColor: colors.accent }]}>
                <Ionicons name="notifications" size={16} color={unread ? colors.onPrimary : colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.body}>{item.body}</Text>
                <Text style={s.date}>{when(item.created_at)}</Text>
              </View>
              {unread ? <View style={s.dot} /> : null}
            </Pressable>
          </Animated.View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: { borderColor: colors.accent, backgroundColor: '#FFF7F4' },
  icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E8EEF6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, lineHeight: 21, color: colors.text, marginTop: 2 },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
});
