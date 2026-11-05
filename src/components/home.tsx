import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useIsFocused, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { HeaderActions, useIsWide } from '@/components/nav';
import { Card, PressableScale, PrimaryButton, Reveal, Tag } from '@/components/ui';
import { formatDate, offices, type HeroSlide, type Industry, type Insight, type Stat } from '@/data/content';
import { heroSlideImages, industryImages, insightImage, officesBannerImage } from '@/data/images';
import { colors, radius, spacing } from '@/theme';

const AUTO_ADVANCE_MS = 5500;
const TOP_BAR_HEIGHT = 48;
/** After the user swipes, wait this long before auto-advancing again. */
const PAUSE_AFTER_TOUCH_MS = 8000;

// ---------------------------------------------------------------------------
// Hero carousel
// ---------------------------------------------------------------------------

/** Full-width, auto-advancing hero slider. Photos parallax with both the page scroll and the swipe. */
export function HeroCarousel({ slides, pageScrollY }: { slides: HeroSlide[]; pageScrollY: SharedValue<number> }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<HeroSlide>>(null);
  const scrollX = useSharedValue(0);
  const lastTouch = useRef(0);
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const wide = useIsWide();
  const topInset = insets.top + (wide ? 0 : TOP_BAR_HEIGHT);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  useEffect(() => {
    if (!focused || slides.length < 2) return;
    const timer = setInterval(() => {
      if (Date.now() - lastTouch.current < PAUSE_AFTER_TOUCH_MS) return;
      const current = Math.round(scrollX.get() / width);
      const next = (current + 1) % slides.length;
      listRef.current?.scrollToOffset({ offset: next * width, animated: !reduceMotion });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [focused, slides.length, width, scrollX, reduceMotion]);

  return (
    <View style={s.heroWrap}>
      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          lastTouch.current = Date.now();
        }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item, index }) => (
          <HeroSlideView
            slide={item}
            index={index}
            width={width}
            topInset={topInset}
            scrollX={scrollX}
            pageScrollY={pageScrollY}
          />
        )}
      />
      <View style={s.dots} pointerEvents="none">
        {slides.map((slide, i) => (
          <Dot key={slide.id} index={i} width={width} scrollX={scrollX} />
        ))}
      </View>
      {/* Phones: brand + search/menu over the hero (wide windows use the desktop navbar instead). */}
      {wide ? null : (
        <View style={[s.topBar, { top: insets.top }]}>
          <Text style={s.topBrand}>NORTHBRIDGE</Text>
          <HeaderActions />
        </View>
      )}
    </View>
  );
}

function HeroSlideView({
  slide,
  index,
  width,
  topInset,
  scrollX,
  pageScrollY,
}: {
  slide: HeroSlide;
  index: number;
  width: number;
  topInset: number;
  scrollX: SharedValue<number>;
  pageScrollY: SharedValue<number>;
}) {
  // Photo drifts slower than the swipe (horizontal parallax) and slower than the page (vertical parallax).
  const imageStyle = useAnimatedStyle(() => {
    const x = scrollX.get() - index * width;
    const y = pageScrollY.get();
    return {
      transform: [
        { translateX: x * 0.35 },
        { translateY: y > 0 ? y * 0.45 : y * 0.5 },
        { scale: interpolate(y, [-200, 0], [1.6, 1.08], Extrapolation.CLAMP) },
      ],
    };
  });

  // Text fades and slides as the slide moves off-centre, and fades as the page scrolls away.
  const contentStyle = useAnimatedStyle(() => {
    const offset = (scrollX.get() - index * width) / width;
    const y = pageScrollY.get();
    return {
      opacity: interpolate(Math.abs(offset), [0, 0.6], [1, 0], Extrapolation.CLAMP) * interpolate(y, [0, 260], [1, 0.2], Extrapolation.CLAMP),
      transform: [{ translateX: offset * -60 }, { translateY: interpolate(y, [0, 260], [0, -30], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View style={[s.slide, { width, paddingTop: topInset + spacing.md }]}>
      <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
        <Image source={heroSlideImages[slide.image]} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, s.slideOverlay]} />

      <Animated.View style={contentStyle}>
        <Reveal index={0}>
          <Text style={s.eyebrow}>{slide.eyebrow}</Text>
        </Reveal>
        <Reveal index={1}>
          <Text style={s.heroTitle}>{slide.title}</Text>
        </Reveal>
        <Reveal index={2}>
          <Text style={s.heroText}>{slide.text}</Text>
        </Reveal>
        <Reveal index={3} style={{ marginTop: spacing.lg }}>
          <PrimaryButton label={slide.cta} icon="arrow-forward" onPress={() => router.push(slide.href as Href)} />
        </Reveal>
      </Animated.View>
    </View>
  );
}

function Dot({ index, width, scrollX }: { index: number; width: number; scrollX: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const page = scrollX.get() / width;
    return {
      width: interpolate(page, [index - 1, index, index + 1], [8, 26, 8], Extrapolation.CLAMP),
      opacity: interpolate(page, [index - 1, index, index + 1], [0.45, 1, 0.45], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[s.dot, style]} />;
}

// ---------------------------------------------------------------------------
// Count-up stats
// ---------------------------------------------------------------------------

function formatNumber(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function useCountUp(target: number, start: boolean, durationMs = 1400) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start || reduceMotion) return;
    let frame = 0;
    const t0 = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - t0) / durationMs, 1);
      setValue(target * (1 - Math.pow(1 - t, 3))); // ease-out cubic
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, durationMs, reduceMotion]);

  // With Reduce Motion on, skip the count and show the final figure.
  return start && reduceMotion ? target : value;
}

function StatValue({ stat, start }: { stat: Stat; start: boolean }) {
  const value = useCountUp(stat.value, start);
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>
        {formatNumber(value)}
        {stat.suffix ?? ''}
      </Text>
      <Text style={s.statLabel}>{stat.label}</Text>
    </View>
  );
}

/** Numbers count up the first time the band scrolls into view. */
export function StatsBand({ stats, scrollY }: { stats: Stat[]; scrollY: SharedValue<number> }) {
  const ref = useAnimatedRef<Animated.View>();
  const { height } = useWindowDimensions();
  const [started, setStarted] = useState(false);
  const startedSV = useSharedValue(false);

  useAnimatedReaction(
    () => scrollY.get(),
    (_y, previous) => {
      if (previous === null || startedSV.get()) return;
      const m = measure(ref);
      if (m && m.pageY < height - 60) {
        startedSV.set(true);
        scheduleOnRN(setStarted, true);
      }
    },
  );

  return (
    <Animated.View
      ref={ref}
      style={s.statsBand}
      onLayout={(e) => {
        // Already on screen without scrolling (e.g. tall phones): start straight away.
        if (e.nativeEvent.layout.y < height - 60) setStarted(true);
      }}
    >
      <Text style={s.statsTitle}>One firm, across the UK</Text>
      <View style={s.statsGrid}>
        {stats.map((stat) => (
          <StatValue key={stat.label} stat={stat} start={started} />
        ))}
      </View>
      <Pressable onPress={() => router.push('/about')} hitSlop={8}>
        <Text style={s.statsLink}>About our network →</Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Horizontal rails
// ---------------------------------------------------------------------------

const REPORT_WIDTH = 260;

export function ReportsRail({ reports }: { reports: Insight[] }) {
  return (
    <FlatList
      data={reports}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={REPORT_WIDTH + spacing.sm}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
      renderItem={({ item, index }) => (
        <Card
          index={index}
          style={{ width: REPORT_WIDTH, overflow: 'hidden', flex: 1 }}
          onPress={() => router.push(`/insight/${item.id}`)}
        >
          <Image source={insightImage(item)} style={s.reportImage} contentFit="cover" transition={250} />
          <Tag label={item.category} />
          <Text style={s.railTitle} numberOfLines={3}>
            {item.title}
          </Text>
          <Text style={s.muted}>
            {formatDate(item.date)} · {item.readMinutes} min read
          </Text>
        </Card>
      )}
    />
  );
}

const INDUSTRY_WIDTH = 150;

export function IndustriesRail({ items }: { items: Industry[] }) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={INDUSTRY_WIDTH + spacing.sm}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
      renderItem={({ item, index }) => (
        <Reveal index={index}>
          <PressableScale style={s.industryTile} onPress={() => router.push(`/industry/${item.id}`)}>
            <Image source={industryImages[item.id]} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
            <View style={[StyleSheet.absoluteFill, s.tileOverlay]} />
            <Ionicons name={item.icon} size={22} color={colors.onPrimary} />
            <Text style={s.industryTitle}>{item.title}</Text>
          </PressableScale>
        </Reveal>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Banners and footer
// ---------------------------------------------------------------------------

export function OfficeBanner() {
  return (
    <PressableScale style={s.banner} onPress={() => router.push('/offices')}>
      <Image source={officesBannerImage} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      <View style={[StyleSheet.absoluteFill, s.bannerOverlay]} />
      <Ionicons name="location" size={26} color={colors.accent} />
      <Text style={s.bannerTitle}>Find a Northbridge office near you</Text>
      <Text style={s.bannerText}>{offices.length} offices across England, Scotland and Wales →</Text>
    </PressableScale>
  );
}

const footerLinks: { label: string; href: Href }[] = [
  { label: 'Contact us', href: '/contact' },
  { label: 'Locations', href: '/offices' },
  { label: 'Careers', href: '/careers' },
  { label: 'News', href: '/news' },
  { label: 'About us', href: '/about' },
  { label: 'Legal & privacy', href: '/legal' },
  { label: 'Fraud alert', href: '/fraud-alert' },
  { label: 'Sitemap', href: '/sitemap' },
];

export function Footer() {
  return (
    <View style={s.footer}>
      <Text style={s.footerBrand}>NORTHBRIDGE ADVISORY</Text>
      <Text style={s.footerTagline}>Clear advice. Real progress.</Text>
      <View style={s.footerLinks}>
        {footerLinks.map((link) => (
          <Pressable key={link.label} onPress={() => router.push(link.href)} style={s.footerLink} hitSlop={4}>
            <Text style={s.footerLinkText}>{link.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.social}>
        <PressableScale scaleTo={0.9} style={s.socialBtn} onPress={() => Linking.openURL('https://www.linkedin.com')}>
          <Ionicons name="logo-linkedin" size={20} color={colors.onPrimary} />
        </PressableScale>
        <PressableScale scaleTo={0.9} style={s.socialBtn} onPress={() => Linking.openURL('https://www.youtube.com')}>
          <Ionicons name="logo-youtube" size={20} color={colors.onPrimary} />
        </PressableScale>
      </View>
      <Text style={s.copyright}>© 2026 Northbridge Advisory (demo). All content is sample data.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  heroWrap: {
    height: 470,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  slide: { height: 470, paddingHorizontal: spacing.md, overflow: 'hidden', justifyContent: 'flex-start' },
  slideOverlay: { backgroundColor: 'rgba(11, 37, 69, 0.74)' },
  eyebrow: { color: colors.accent, fontWeight: '800', letterSpacing: 2, fontSize: 12, marginTop: spacing.sm },
  heroTitle: { color: colors.onPrimary, fontSize: 30, fontWeight: '800', marginTop: spacing.sm, lineHeight: 36 },
  heroText: { color: '#C9D4E3', fontSize: 16, lineHeight: 23, marginTop: spacing.sm },
  dots: { position: 'absolute', bottom: spacing.md, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.onPrimary },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TOP_BAR_HEIGHT,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBrand: { color: colors.onPrimary, fontWeight: '900', letterSpacing: 3, fontSize: 16 },

  statsBand: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  statsTitle: { color: colors.onPrimary, fontSize: 18, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  stat: { width: '50%', paddingVertical: spacing.sm },
  statValue: { color: colors.accent, fontSize: 30, fontWeight: '800' },
  statLabel: { color: '#C9D4E3', fontSize: 13, marginTop: 2 },
  statsLink: { color: colors.onPrimary, fontWeight: '700', marginTop: spacing.sm },

  reportImage: {
    height: 140,
    marginTop: -spacing.md,
    marginHorizontal: -spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: '#E8EEF6',
  },
  railTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginVertical: 6 },
  muted: { fontSize: 13, color: colors.textMuted },

  industryTile: {
    width: INDUSTRY_WIDTH,
    height: 180,
    borderRadius: radius.md,
    overflow: 'hidden',
    padding: spacing.md,
    justifyContent: 'flex-end',
    gap: 6,
    backgroundColor: colors.primary,
  },
  tileOverlay: { backgroundColor: 'rgba(11, 37, 69, 0.55)' },
  industryTitle: { color: colors.onPrimary, fontWeight: '800', fontSize: 15 },

  banner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    height: 170,
    borderRadius: radius.md,
    overflow: 'hidden',
    padding: spacing.md,
    justifyContent: 'flex-end',
    backgroundColor: colors.primary,
  },
  bannerOverlay: { backgroundColor: 'rgba(11, 37, 69, 0.6)' },
  bannerTitle: { color: colors.onPrimary, fontSize: 20, fontWeight: '800', marginTop: 6 },
  bannerText: { color: '#C9D4E3', marginTop: 4, fontWeight: '600' },

  footer: { backgroundColor: colors.primary, marginTop: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xl },
  footerBrand: { color: colors.accent, fontWeight: '800', letterSpacing: 2, fontSize: 12 },
  footerTagline: { color: colors.onPrimary, fontSize: 20, fontWeight: '800', marginTop: spacing.sm },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  footerLink: { width: '50%', paddingVertical: 8 },
  footerLinkText: { color: '#C9D4E3', fontSize: 15, fontWeight: '600' },
  social: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyright: { color: '#8FA0B8', fontSize: 12, marginTop: spacing.lg },
});
