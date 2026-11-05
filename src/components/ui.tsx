import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  ReduceMotion,
  interpolate,
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { IconName } from '@/data/content';
import { colors, radius, spacing } from '@/theme';

// ---------------------------------------------------------------------------
// Replay on every visit
// ---------------------------------------------------------------------------

/**
 * Returns a key that changes each time the screen regains focus (not on the first focus).
 * Put it on the screen's root element to remount it, which replays its entrance animations.
 */
export function useReplayKey() {
  const [key, setKey] = useState(0);
  const focusedBefore = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedBefore.current) {
        focusedBefore.current = true;
        return;
      }
      setKey((k) => k + 1);
    }, []),
  );
  return key;
}

// ---------------------------------------------------------------------------
// Animate on scroll
// ---------------------------------------------------------------------------

const ScrollRevealContext = createContext<SharedValue<number> | null>(null);

/** Provide a scroll position to descendant cards so they reveal as they scroll into view. */
export const ScrollRevealProvider = ScrollRevealContext.Provider;

/** Tracks a scroll view's vertical offset on the UI thread. Pass `onScroll` to an Animated scroll view. */
export function useScrollTracker() {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  return { scrollY, onScroll };
}

/** Distance (px) over which an item fades/slides in as its top rises past the bottom of the screen. */
const REVEAL_DISTANCE = 140;
const REVEAL_BOTTOM_INSET = 40;

/** Scroll-linked reveal: content fades and slides up as it enters the viewport, and reverses when scrolled away. */
export function ScrollReveal({ children, scrollY }: { children: ReactNode; scrollY: SharedValue<number> }) {
  const ref = useAnimatedRef<Animated.View>();
  const { height } = useWindowDimensions();
  const progress = useSharedValue(1);

  useAnimatedReaction(
    () => scrollY.get(),
    (_current, previous) => {
      // Skip the initial run: the view may not be laid out yet, and on-screen items should stay visible.
      if (previous === null) return;
      const m = measure(ref);
      if (!m) return;
      const visible = height - REVEAL_BOTTOM_INSET - m.pageY;
      progress.set(Math.min(Math.max(visible / REVEAL_DISTANCE, 0), 1));
    },
  );

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: p,
      transform: [{ translateY: (1 - p) * 40 }, { scale: 0.94 + 0.06 * p }],
    };
  });

  return (
    <Animated.View ref={ref} style={style}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.6, reduceMotion: ReduceMotion.System };

/** Staggered "fade up" entrance. Delay is capped so long lists don't wait. Honors OS Reduce Motion. */
export const enterAt = (index = 0) =>
  FadeInDown.delay(Math.min(index, 8) * 60)
    .duration(420)
    .reduceMotion(ReduceMotion.System);

/** Wraps any content in a staggered entrance animation. */
export function Reveal({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={enterAt(index)} style={style}>
      {children}
    </Animated.View>
  );
}

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed (default 0.97). */
  scaleTo?: number;
};

/** Pressable that springs down slightly while pressed, animated on the UI thread. */
export function PressableScale({ style, scaleTo = 0.97, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.set(withSpring(scaleTo, PRESS_SPRING));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, PRESS_SPRING));
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    />
  );
}

// ---------------------------------------------------------------------------
// UI components
// ---------------------------------------------------------------------------

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Style for the outer animated wrapper, e.g. a percentage width when the card sits in a wrapping grid. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Position in a list; when set, the card animates in with a stagger (and reveals on scroll inside a ScrollRevealProvider). */
  index?: number;
  /** Set false to opt out of scroll reveal. */
  scrollReveal?: boolean;
};

export function Card({ children, onPress, style, containerStyle, index, scrollReveal = true }: CardProps) {
  const scrollY = useContext(ScrollRevealContext);
  const reduceMotion = useReducedMotion();

  const card = onPress ? (
    <PressableScale onPress={onPress} style={[styles.card, style]}>
      {children}
    </PressableScale>
  ) : (
    <View style={[styles.card, style]}>{children}</View>
  );

  // Entrance, scroll reveal and press-scale each animate `transform`, so each gets its own view.
  const entered =
    index === undefined && !containerStyle ? (
      card
    ) : (
      <Animated.View entering={index === undefined ? undefined : enterAt(index)} style={containerStyle}>
        {card}
      </Animated.View>
    );

  if (scrollY && scrollReveal && index !== undefined && !reduceMotion) {
    return <ScrollReveal scrollY={scrollY}>{entered}</ScrollReveal>;
  }
  return entered;
}

/**
 * Full-bleed header photo for a screen whose content container uses `styles.screen` padding.
 * Scrolls at under half speed (parallax) and zooms when the user pulls down.
 */
export function ParallaxImage({ source, scrollY, height = 220 }: { source: ImageSource | number; scrollY: SharedValue<number>; height?: number }) {
  const style = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      transform: [
        { translateY: y > 0 ? y * 0.4 : y * 0.5 },
        { scale: interpolate(y, [-200, 0], [1.6, 1], Extrapolation.CLAMP) },
      ],
    };
  });
  return (
    <View style={[styles.parallax, { height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      </Animated.View>
    </View>
  );
}

/** Horizontal bar that animates to `value` (0–1) whenever it changes. */
export function ProgressBar({ value, color = colors.accent, delay = 0 }: { value: number; color?: string; delay?: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withDelay(delay, withTiming(Math.min(Math.max(value, 0), 1), { duration: 900, reduceMotion: ReduceMotion.System })));
  }, [value, delay, progress]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { backgroundColor: color }, fill]} />
    </View>
  );
}

/** Edge-to-edge photo at the top of a Card (cancels the card's padding). */
export function CardImage({ source, height = 140 }: { source: ImageSource | number; height?: number }) {
  return <Image source={source} style={[styles.cardImage, { height }]} contentFit="cover" transition={250} />;
}

export function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

export function IconBadge({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <View style={styles.iconBadge}>
      <Ionicons name={name} size={size} color={colors.primary} />
    </View>
  );
}

type ListRowProps = { icon: IconName; title: string; subtitle?: string; onPress: () => void; index?: number };

export function ListRow({ icon, title, subtitle, onPress, index }: ListRowProps) {
  return (
    <Animated.View entering={index === undefined ? undefined : enterAt(index)}>
      <PressableScale onPress={onPress} style={styles.row}>
        <IconBadge name={icon} size={20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </PressableScale>
    </Animated.View>
  );
}

export function PrimaryButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: IconName }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.96} style={styles.button}>
      {icon ? <Ionicons name={icon} size={18} color={colors.onPrimary} /> : null}
      <Text style={styles.buttonText}>{label}</Text>
    </PressableScale>
  );
}

export const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sectionAction: { fontSize: 14, fontWeight: '600', color: colors.accent },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: '#E1E7EF', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  parallax: {
    marginTop: -spacing.md,
    marginHorizontal: -spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  cardImage: {
    marginTop: -spacing.md,
    marginHorizontal: -spacing.md,
    marginBottom: spacing.sm,
    borderTopLeftRadius: radius.md - 1,
    borderTopRightRadius: radius.md - 1,
    backgroundColor: '#E8EEF6',
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.accent },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: '#E8EEF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  button: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  screen: { padding: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.background },
  h1: { fontSize: 24, fontWeight: '800', color: colors.text },
  body: { fontSize: 15, lineHeight: 23, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
});
