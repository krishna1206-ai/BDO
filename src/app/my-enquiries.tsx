import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Reveal, styles as ui } from '@/components/ui';
import { myEnquiries, type MyEnquiry } from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

const STATUS: Record<string, { label: string; color: string }> = {
  new: { label: 'Received', color: '#1F5FBF' },
  in_progress: { label: 'In progress', color: '#D98E04' },
  replied: { label: 'Replied', color: '#1E8E5A' },
  closed: { label: 'Closed', color: '#5B6573' },
};

/** The signed-in user's enquiries; each opens its chat with our team. */
export default function MyEnquiriesScreen() {
  const [items, setItems] = useState<MyEnquiry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    myEnquiries()
      .then((rows) => active && setItems(rows))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Could not load your enquiries.'));
    return () => {
      active = false;
    };
  }, []);

  return (
    <FlatList
      data={items ?? []}
      keyExtractor={(e) => String(e.id)}
      contentContainerStyle={ui.screen}
      ListHeaderComponent={
        <>
          <Text style={ui.h1}>My enquiries</Text>
          <Text style={[ui.muted, { marginTop: 4, marginBottom: spacing.md }]}>Open an enquiry to chat with our team.</Text>
          {error ? <Text style={{ color: '#B42318', marginBottom: spacing.md }}>{error}</Text> : null}
          {!items && !error ? <ActivityIndicator color={colors.primary} /> : null}
        </>
      }
      ListEmptyComponent={
        items ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <Text style={ui.muted}>You haven&apos;t sent any enquiries yet.</Text>
            <Pressable onPress={() => router.push('/contact')} style={s.cta}>
              <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Send an enquiry</Text>
            </Pressable>
          </View>
        ) : undefined
      }
      renderItem={({ item, index }) => {
        const st = STATUS[item.status] ?? { label: item.status, color: colors.primary };
        return (
          <Reveal index={index}>
            <Pressable onPress={() => router.push(`/chat/${item.id}`)} style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{item.topic || 'General enquiry'}</Text>
                <Text style={s.body} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={s.date}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: spacing.sm }}>
                <View style={[s.pill, { borderColor: st.color }]}>
                  <Text style={[s.pillText, { color: st.color }]}>{st.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="chatbubbles-outline" size={16} color={colors.primaryLink} />
                  <Text style={{ color: colors.primaryLink, fontWeight: '700' }}>Chat</Text>
                </View>
              </View>
            </Pressable>
          </Reveal>
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
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.lg, borderWidth: 1 },
  pillText: { fontSize: 12, fontWeight: '700' },
  cta: { marginTop: spacing.md, backgroundColor: colors.accent, paddingHorizontal: spacing.lg, paddingVertical: 12, borderRadius: radius.md },
});
