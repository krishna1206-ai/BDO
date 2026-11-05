import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  LinearTransition,
  ReduceMotion,
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { PrimaryButton, Reveal, ScrollRevealProvider, useScrollTracker } from '@/components/ui';
import { colors, spacing } from '@/theme';

/** Two-column layout from this width up; below it the side panel stacks under the intro. */
const TWO_COLUMN = 900;

export type Crumb = { title: string; href?: Href };
export type SideLink = { title: string; href: Href; active?: boolean };
export type PageSection = {
  title: string;
  body?: string[];
  bullets?: string[];
  cards?: { title: string; text: string; icon?: string }[];
  /**
   * 'pillars': accent headings in a row. 'boxes' (default): grey boxes.
   * 'feature': full-width, centred heading, bold-titled list beside a photo (also gets a tab in the tab bar).
   */
  cardStyle?: 'pillars' | 'boxes' | 'feature';
  after?: string[];
};

export type RelatedItem = { id: string; title: string; category: string; date: string; image: number };
export type Leader = { name: string; role: string; office: string; email: string };

type Props = {
  crumbs: Crumb[];
  title: string;
  image: number;
  headline: string;
  /** One string per paragraph (or a single string). An empty array renders nothing. */
  intro: string | string[];
  sections: PageSection[];
  sideLinks?: SideLink[];
  /** Heading above the side panel list, e.g. "Our Accounting Advisory Services". */
  sideTitle?: string;
  /** One-line subtitle shown in the banner under the title. */
  subtitle?: string;
  /** Pre-filled topic for the contact form. */
  contactTopic: string;
  /** Photo shown beside 'feature' sections. */
  featureImage?: number;
  /** Related articles ("Insights" tab). */
  related?: RelatedItem[];
  /** Key contact ("Meet our leader" tab). */
  leader?: Leader;
  /** Questions and answers ("FAQs" tab). */
  faqs?: { q: string; a: string }[];
  /** Extra content rendered after the main-column sections (e.g. key contacts). */
  children?: ReactNode;
};

/**
 * Website-style content page: breadcrumb, diagonal photo banner, in-page tab bar, overview with side panel,
 * full-width feature sections, related insights, leader card, contact block and FAQs.
 */
export function ContentPage({
  crumbs,
  title,
  image,
  headline,
  intro,
  sections,
  sideLinks,
  sideTitle,
  subtitle,
  contactTopic,
  featureImage,
  related,
  leader,
  faqs,
  children,
}: Props) {
  const { width } = useWindowDimensions();
  const twoCol = width >= TWO_COLUMN;
  const { scrollY, onScroll } = useScrollTracker();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  // Content-relative y position of each tab's target block, recorded on layout.
  const [anchors] = useState(() => new Map<string, number>());
  const anchor = (key: string) => (e: LayoutChangeEvent) => {
    anchors.set(key, e.nativeEvent.layout.y);
  };

  const mainSections = sections.filter((x) => x.cardStyle !== 'feature');
  const featureSections = sections.filter((x) => x.cardStyle === 'feature');

  const tabs = [
    ...featureSections.map((x) => x.title),
    ...(related?.length ? ['Insights'] : []),
    ...(leader ? ['Meet our leader'] : []),
    'Contact',
    ...(faqs?.length ? ['FAQs'] : []),
  ];
  const jump = (key: string) => {
    const y = anchors.get(key);
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(y - 8, 0), animated: true });
  };

  const sidePanel = sideLinks && sideLinks.length > 0 ? <SidePanel links={sideLinks} title={sideTitle} /> : null;
  const contact = () => router.push({ pathname: '/contact', params: { service: contactTopic } });
  const pad = twoCol ? 48 : spacing.md;

  return (
    <ScrollRevealProvider value={scrollY}>
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ backgroundColor: colors.surface }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <Breadcrumbs crumbs={crumbs} />
        <Banner title={title} subtitle={subtitle} onContact={contact} image={image} scrollY={scrollY} twoCol={twoCol} />

        {/* In-page tab bar, as on the client website. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={[s.tabBarInner, { paddingHorizontal: pad }]}>
          {tabs.map((t) => (
            <Pressable key={t} onPress={() => jump(t)} hitSlop={6}>
              {({ hovered }) => <Text style={[s.tabText, hovered && { color: colors.accent }]}>{t}</Text>}
            </Pressable>
          ))}
        </ScrollView>

        <View style={[s.body, twoCol && s.bodyWide]}>
          <View style={[s.main, twoCol && { paddingRight: 48 }]}>
            <Reveal index={1}>
              <Text style={[s.headline, twoCol && { fontSize: 30, lineHeight: 38 }]}>{headline}</Text>
              {(Array.isArray(intro) ? intro : [intro]).map((p, i) => (
                <Text key={i} style={s.intro}>
                  {p}
                </Text>
              ))}
            </Reveal>

            {!twoCol && sidePanel ? <Reveal index={2} style={{ marginTop: spacing.lg }}>{sidePanel}</Reveal> : null}

            {mainSections.map((section, i) => (
              <Reveal key={section.title} index={i + 3} style={s.section}>
                <SectionBody section={section} twoCol={twoCol} />
              </Reveal>
            ))}

            {children}
          </View>

          {twoCol && sidePanel ? <Reveal index={2} style={{ width: 420 }}>{sidePanel}</Reveal> : null}
        </View>

        {featureSections.map((section) => (
          <View key={section.title} onLayout={anchor(section.title)} style={[s.feature, { paddingHorizontal: pad }]}>
            <Reveal index={0}>
              <Text style={s.featureTitle}>{section.title}</Text>
              {section.body?.map((p) => (
                <Text key={p} style={s.featureIntro}>
                  {p}
                </Text>
              ))}
            </Reveal>
            <View style={[s.featureRow, !twoCol && { flexDirection: 'column' }]}>
              <View style={{ flex: 1, maxWidth: twoCol ? 520 : undefined }}>
                {section.cards?.map((c, ci) => (
                  <Reveal key={c.title} index={ci + 1} style={s.bulletRow}>
                    <Ionicons name="caret-forward" size={12} color={colors.accent} style={{ marginTop: 6 }} />
                    <Text style={[s.paragraph, { flex: 1, marginTop: 0 }]}>
                      <Text style={{ fontWeight: '800' }}>{c.title}: </Text>
                      {c.text}
                    </Text>
                  </Reveal>
                ))}
              </View>
              {featureImage ? (
                <Reveal index={2} style={{ width: twoCol ? 340 : '100%' }}>
                  <Image source={featureImage} style={s.featureImage} contentFit="cover" transition={300} />
                </Reveal>
              ) : null}
            </View>
          </View>
        ))}

        {related?.length ? (
          <View onLayout={anchor('Insights')} style={[s.block, { paddingHorizontal: pad }]}>
            <Text style={s.blockTitle}>Insights</Text>
            <View style={s.relatedRow}>
              {related.map((r, i) => (
                <Reveal key={r.id} index={i} style={{ width: twoCol ? '31.5%' : '100%' }}>
                  <Pressable onPress={() => router.push(`/insight/${r.id}` as Href)} style={s.relatedCard}>
                    {({ hovered }) => (
                      <>
                        <Image source={r.image} style={s.relatedImage} contentFit="cover" transition={250} />
                        <View style={{ padding: spacing.md }}>
                          <Text style={s.relatedCategory}>{r.category}</Text>
                          <Text style={[s.relatedTitle, hovered && { color: colors.accent }]}>{r.title}</Text>
                          <Text style={s.relatedDate}>{r.date}</Text>
                        </View>
                      </>
                    )}
                  </Pressable>
                </Reveal>
              ))}
            </View>
          </View>
        ) : null}

        {leader ? (
          <View onLayout={anchor('Meet our leader')} style={[s.block, { paddingHorizontal: pad }]}>
            <Text style={s.blockTitle}>Meet our leader</Text>
            <Reveal index={0} style={[s.leaderCard, twoCol && { maxWidth: 520 }]}>
              <View style={s.leaderAvatar}>
                <Text style={s.leaderInitials}>
                  {leader.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.leaderName}>{leader.name}</Text>
                <Text style={s.leaderRole}>
                  {leader.role} · {leader.office}
                </Text>
                <Pressable onPress={() => Linking.openURL(`mailto:${leader.email}`)} hitSlop={6}>
                  <Text style={s.leaderEmail}>{leader.email}</Text>
                </Pressable>
              </View>
            </Reveal>
          </View>
        ) : null}

        <View onLayout={anchor('Contact')} style={[s.block, { paddingHorizontal: pad }]}>
          <Reveal index={0} style={s.contactBox}>
            <Text style={s.contactTitle}>Talk to our specialists</Text>
            <Text style={s.contactText}>Tell us what you are working on and the right person will be in touch within one working day.</Text>
            <View style={{ marginTop: spacing.md, alignSelf: twoCol ? 'flex-start' : 'stretch', minWidth: twoCol ? 280 : undefined }}>
              <PrimaryButton label="Contact us" icon="mail-outline" onPress={contact} />
            </View>
          </Reveal>
        </View>

        {faqs?.length ? (
          <View onLayout={anchor('FAQs')} style={[s.block, { paddingHorizontal: pad }]}>
            <Text style={s.blockTitle}>FAQs</Text>
            {faqs.map((f, i) => (
              <Faq key={f.q} q={f.q} a={f.a} index={i} />
            ))}
          </View>
        ) : null}
      </Animated.ScrollView>
    </ScrollRevealProvider>
  );
}

/** Heading, paragraphs, bullets and card grid for a section in the main column. */
function SectionBody({ section, twoCol }: { section: PageSection; twoCol: boolean }) {
  return (
    <>
      <Text style={s.sectionTitle}>{section.title}</Text>
      {section.body?.map((p) => (
        <Text key={p} style={s.paragraph}>
          {p}
        </Text>
      ))}
      {section.bullets?.map((b) => (
        <View key={b} style={s.bulletRow}>
          <Ionicons name="caret-forward" size={12} color={colors.accent} style={{ marginTop: 6 }} />
          <Text style={[s.paragraph, { flex: 1, marginTop: 0 }]}>{b}</Text>
        </View>
      ))}
      {section.cards ? (
        <View style={s.cardGrid}>
          {section.cards.map((c, ci) =>
            section.cardStyle === 'pillars' ? (
              <Reveal key={c.title} index={ci} style={[s.pillar, { width: twoCol ? '22.5%' : '100%' }]}>
                <View style={s.pillarHead}>
                  {/* Grey diagonal shape behind the heading. */}
                  <View style={s.pillarShape} />
                  <Text style={s.pillarTitle}>{c.title}</Text>
                </View>
                <Text style={s.pillarText}>{c.text}</Text>
              </Reveal>
            ) : (
              <Reveal key={c.title} index={ci} style={[s.infoCard, { width: twoCol ? '23%' : '100%' }]}>
                {c.icon ? <Ionicons name={c.icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.accent} /> : null}
                <Text style={s.infoCardTitle}>{c.title}</Text>
                <Text style={s.infoCardText}>{c.text}</Text>
              </Reveal>
            ),
          )}
        </View>
      ) : null}
      {section.after?.map((p) => (
        <Text key={p} style={[s.paragraph, { marginTop: spacing.md }]}>
          {p}
        </Text>
      ))}
    </>
  );
}

/** Expandable question: the answer fades in and the chevron turns. */
function Faq({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal index={index} style={s.faq}>
      <Pressable onPress={() => setOpen((v) => !v)} style={s.faqHead} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Text style={s.faqQ}>{q}</Text>
        <Ionicons name={open ? 'remove' : 'add'} size={22} color={colors.accent} />
      </Pressable>
      {open ? (
        <Animated.View entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)} layout={LinearTransition}>
          <Text style={[s.paragraph, { marginTop: 0, paddingBottom: spacing.md }]}>{a}</Text>
        </Animated.View>
      ) : null}
    </Reveal>
  );
}

function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <View style={s.crumbs}>
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <View key={`${c.title}-${i}`} style={s.crumb}>
            <Ionicons name="chevron-back" size={12} color={colors.text} />
            {c.href && !last ? (
              <Pressable onPress={() => router.push(c.href!)} hitSlop={6}>
                {({ hovered }) => <Text style={[s.crumbText, hovered && { textDecorationLine: 'underline' }]}>{c.title}</Text>}
              </Pressable>
            ) : (
              <Text style={[s.crumbText, last && { color: colors.textMuted }]} numberOfLines={1}>
                {c.title}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Grey panel on the left, photo on the right, joined by a diagonal edge. The photo drifts with scroll. */
function Banner({
  title,
  subtitle,
  onContact,
  image,
  scrollY,
  twoCol,
}: {
  title: string;
  subtitle?: string;
  onContact: () => void;
  image: number;
  scrollY: SharedValue<number>;
  twoCol: boolean;
}) {
  const height = twoCol ? 360 : 300;
  const imageStyle = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      transform: [
        { translateY: y > 0 ? y * 0.35 : 0 },
        { scale: interpolate(y, [-200, 0], [1.4, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <View style={[s.banner, { height }]}>
      <Animated.View style={[s.bannerImageWrap, { width: twoCol ? '68%' : '72%' }, imageStyle]}>
        <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      </Animated.View>
      {/* Diagonal grey panels in front of the photo's left edge. */}
      <View style={[s.diagonal, { width: twoCol ? '52%' : '62%', height: height * 2, top: -height / 2 }]} />
      <View style={[s.diagonalLight, { width: twoCol ? '30%' : '34%', height: height * 2, top: -height / 2 }]} />

      <Reveal index={0} style={[s.bannerTitleWrap, { maxWidth: twoCol ? '40%' : '52%' }]}>
        <Text style={[s.bannerTitle, twoCol && { fontSize: 34, lineHeight: 42 }]}>{title}</Text>
        {subtitle ? (
          <Text style={s.bannerSubtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
        <Pressable onPress={onContact} style={({ hovered, pressed }) => [s.bannerCta, (hovered || pressed) && { opacity: 0.88 }]}>
          <Text style={s.bannerCtaText}>CONTACT US</Text>
        </Pressable>
      </Reveal>
    </View>
  );
}

function SidePanel({ links, title }: { links: SideLink[]; title?: string }) {
  return (
    <View style={s.panel}>
      {title ? <Text style={s.panelTitle}>{title}</Text> : null}
      {links.map((link) => (
        <Pressable
          key={link.title}
          onPress={() => (link.active ? undefined : router.push(link.href))}
          style={({ hovered, pressed }) => [s.panelRow, (link.active || hovered || pressed) && s.panelRowActive]}
        >
          <Text style={[s.panelText, link.active && { fontWeight: '800' }]}>{link.title}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primaryLink} />
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  tabBar: { flexGrow: 0, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabBarInner: { gap: spacing.lg, paddingVertical: 14 },
  tabText: { fontSize: 14, color: colors.text },

  feature: { marginTop: spacing.xl, paddingTop: spacing.lg, alignItems: 'center' },
  featureTitle: { fontSize: 26, fontWeight: '400', color: colors.text, textAlign: 'center' },
  featureIntro: { fontSize: 15, lineHeight: 23, color: colors.text, textAlign: 'center', marginTop: spacing.sm, maxWidth: 900 },
  featureRow: { flexDirection: 'row', gap: 40, marginTop: spacing.lg, alignItems: 'flex-start', maxWidth: 980, width: '100%' },
  featureImage: { width: '100%', height: 240, backgroundColor: '#E8EEF6' },

  block: { marginTop: spacing.xl },
  blockTitle: { fontSize: 24, fontWeight: '400', color: colors.text, marginBottom: spacing.md },
  relatedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  relatedCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  relatedImage: { height: 150, backgroundColor: '#E8EEF6' },
  relatedCategory: { fontSize: 12, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 1 },
  relatedTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4, lineHeight: 22 },
  relatedDate: { fontSize: 13, color: colors.textMuted, marginTop: 6 },

  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: '#F5F6F8',
    borderLeftWidth: 5,
    borderLeftColor: colors.accent,
  },
  leaderAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  leaderInitials: { color: colors.onPrimary, fontSize: 22, fontWeight: '800' },
  leaderName: { fontSize: 18, fontWeight: '800', color: colors.text },
  leaderRole: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  leaderEmail: { fontSize: 14, color: colors.primaryLink, marginTop: 6 },

  faq: { borderBottomWidth: 1, borderColor: colors.border },
  faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.md },
  faqQ: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },

  crumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: '#F5F6F8',
  },
  crumb: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  crumbText: { fontSize: 12, color: colors.text },

  banner: { overflow: 'hidden', backgroundColor: '#ECEEF1', justifyContent: 'center' },
  bannerImageWrap: { position: 'absolute', top: 0, bottom: 0, right: 0 },
  diagonal: {
    position: 'absolute',
    left: '-14%',
    backgroundColor: '#ECEEF1',
    transform: [{ skewX: '-32deg' }],
  },
  diagonalLight: {
    position: 'absolute',
    left: '-6%',
    backgroundColor: '#F4F5F7',
    transform: [{ skewX: '-32deg' }],
  },
  bannerTitleWrap: { paddingHorizontal: spacing.md },
  bannerTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.text },
  bannerSubtitle: { fontSize: 14, lineHeight: 21, color: colors.text, marginTop: spacing.sm },
  bannerCta: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  bannerCtaText: { color: colors.onPrimary, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  panelTitle: { fontSize: 22, lineHeight: 29, fontWeight: '700', color: colors.text, marginBottom: spacing.md },

  body: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  bodyWide: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 48, paddingTop: 56 },
  main: { flex: 1 },
  headline: { fontSize: 24, lineHeight: 31, fontWeight: '300', color: colors.text },
  intro: { fontSize: 15, lineHeight: 24, color: colors.text, marginTop: spacing.md },

  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  paragraph: { fontSize: 15, lineHeight: 24, color: colors.text, marginTop: spacing.sm },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, alignItems: 'flex-start' },
  bulletDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginTop: 9 },

  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  infoCard: {
    padding: spacing.md,
    backgroundColor: '#F2F3F5',
    borderWidth: 1,
    borderColor: '#E3E6EA',
    gap: 6,
  },
  infoCardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  infoCardText: { fontSize: 13, lineHeight: 20, color: colors.text },
  pillar: { paddingVertical: spacing.sm },
  pillarHead: { minHeight: 64, justifyContent: 'center', paddingLeft: 44, marginBottom: spacing.sm },
  pillarShape: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 34,
    height: 56,
    backgroundColor: '#E6E8EC',
    transform: [{ skewX: '-18deg' }],
  },
  pillarTitle: { fontSize: 20, lineHeight: 25, fontWeight: '800', color: colors.accent },
  pillarText: { fontSize: 13, lineHeight: 20, fontWeight: '600', color: colors.text },
  contactBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  contactTitle: { fontSize: 20, fontWeight: '800', color: colors.onPrimary },
  contactText: { fontSize: 15, lineHeight: 22, color: '#C9D4E3', marginTop: spacing.sm },

  panel: {
    backgroundColor: colors.surface,
    borderLeftWidth: 5,
    borderLeftColor: colors.accent,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  panelRowActive: { backgroundColor: '#F2F4F7' },
  panelText: { fontSize: 14, color: colors.text, flex: 1 },
});
