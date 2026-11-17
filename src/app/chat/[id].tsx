import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { getEnquiry, listMessages, sendMessage, subscribeToMessages, type ChatMessage, type EnquiryRow } from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

const time = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const STATUS_LABEL: Record<string, string> = { new: 'Received', in_progress: 'In progress', replied: 'Replied', closed: 'Closed' };

/** Real-time chat on one enquiry, shared by the enquiry's sender and the admins. */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const enquiryId = Number(id);
  const { user, isAdmin } = useAuth();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [enquiry, setEnquiry] = useState<EnquiryRow | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  // Load the enquiry and its messages, then listen for new messages live.
  useEffect(() => {
    if (!Number.isFinite(enquiryId)) return;
    let active = true;
    Promise.all([getEnquiry(enquiryId), listMessages(enquiryId)])
      .then(([e, m]) => {
        if (!active) return;
        if (!e) setError('This enquiry was not found, or you do not have access to it.');
        setEnquiry(e);
        setMessages(m);
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Could not load the conversation.'));

    const unsubscribe = subscribeToMessages(enquiryId, (m) => {
      // Ignore duplicates (our own message is added as soon as it's sent).
      setMessages((prev) => (prev && !prev.some((x) => x.id === m.id) ? [...prev, m] : prev));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [enquiryId]);

  // Keep the newest message in view.
  useEffect(() => {
    if (messages?.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages?.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const m = await sendMessage(enquiryId, text);
      setDraft('');
      setMessages((prev) => (prev && !prev.some((x) => x.id === m.id) ? [...prev, m] : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the message.');
    } finally {
      setSending(false);
    }
  };

  const title = enquiry?.topic || 'Enquiry';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title: isAdmin ? `Chat · ${enquiry?.full_name ?? ''}` : `Chat · ${title}` }} />

      {/* The original enquiry, pinned at the top. */}
      {enquiry ? (
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle} numberOfLines={1}>
              {title}
              {isAdmin ? <Text style={s.headerMeta}>  ·  {enquiry.full_name} ({enquiry.email})</Text> : null}
            </Text>
            <Text style={s.headerBody} numberOfLines={2}>
              {enquiry.message}
            </Text>
          </View>
          <View style={s.statusPill}>
            <Text style={s.statusText}>{STATUS_LABEL[enquiry.status] ?? enquiry.status}</Text>
          </View>
        </View>
      ) : null}

      {error ? <Text style={s.error}>{error}</Text> : null}
      {!messages && !error ? <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} /> : null}

      <FlatList
        ref={listRef}
        data={messages ?? []}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          messages ? (
            <Text style={s.empty}>
              {isAdmin ? 'No messages yet. Write a reply below.' : 'No messages yet. Our team will reply here, or you can send a message.'}
            </Text>
          ) : undefined
        }
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <Animated.View
              entering={FadeInUp.duration(220).reduceMotion(ReduceMotion.System)}
              style={[s.bubbleRow, mine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}
            >
              <View style={[s.bubble, mine ? s.mine : s.theirs]}>
                {!mine && item.from_admin ? <Text style={s.teamLabel}>Our team</Text> : null}
                <Text style={[s.bubbleText, mine && { color: colors.onPrimary }]}>{item.body}</Text>
                <Text style={[s.bubbleTime, mine && { color: '#C9D4E3' }]}>{time(item.created_at)}</Text>
              </View>
            </Animated.View>
          );
        }}
      />

      {/* Composer */}
      <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a message…"
          placeholderTextColor={colors.textMuted}
          multiline
          style={s.input}
          onKeyPress={(e) => {
            // Web: Enter sends, Shift+Enter adds a new line.
            const ne = e.nativeEvent as { key: string; shiftKey?: boolean };
            if (Platform.OS === 'web' && ne.key === 'Enter' && !ne.shiftKey) {
              (e as unknown as { preventDefault?: () => void }).preventDefault?.();
              send();
            }
          }}
        />
        <Pressable
          onPress={send}
          disabled={!draft.trim() || sending}
          accessibilityLabel="Send message"
          style={[s.sendBtn, (!draft.trim() || sending) && { opacity: 0.5 }]}
        >
          {sending ? <ActivityIndicator color={colors.onPrimary} size="small" /> : <Ionicons name="send" size={18} color={colors.onPrimary} />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  headerMeta: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  headerBody: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.lg, backgroundColor: '#E8EEF6' },
  statusText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  error: { color: '#B42318', padding: spacing.md },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  teamLabel: { fontSize: 11, fontWeight: '800', color: colors.accent, marginBottom: 2 },
  bubbleText: { fontSize: 15, lineHeight: 21, color: colors.text },
  bubbleTime: { fontSize: 11, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
