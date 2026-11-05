import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname, type Href } from 'expo-router';
import { useState } from 'react';
import { Image } from 'expo-image';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, ReduceMotion, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui';
import { insights } from '@/data/content';
import { insightImage } from '@/data/images';
import { featuredLinks, mainNav, utilityNav, type NavNode } from '@/data/nav';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/theme';

/** Desktop-style navbar is used on web when the window is wide enough to fit it. */
export const WIDE_BREAKPOINT = 1024;

export function useIsWide() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WIDE_BREAKPOINT;
}

const goSearch = (q: string, replace: boolean) => {
  const href = { pathname: '/search', params: { q } } as const;
  if (replace) router.replace(href);
  else router.push(href);
};

// ---------------------------------------------------------------------------
// Header buttons (phones / narrow windows)
// ---------------------------------------------------------------------------

/** Search + hamburger buttons for screen headers. */
export function HeaderActions({ tint = colors.onPrimary }: { tint?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: Platform.OS === 'web' ? spacing.sm : 0 }}>
      <Pressable accessibilityLabel="Search" hitSlop={8} style={s.iconBtn} onPress={() => router.push('/search')}>
        <Ionicons name="search" size={22} color={tint} />
      </Pressable>
      <Pressable accessibilityLabel="Open menu" hitSlop={8} style={s.iconBtn} onPress={() => router.push('/menu')}>
        <Ionicons name="menu" size={26} color={tint} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Full-screen drill-down menu (phones)
// ---------------------------------------------------------------------------

export function MobileMenu() {
  const [path, setPath] = useState<NavNode[]>([]);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [query, setQuery] = useState('');

  const current = path[path.length - 1];
  const items = current ? (current.children ?? []) : mainNav;

  const open = (href: Href) => router.replace(href);
  const activate = (node: NavNode) => {
    if (node.children) drillIn(node);
    else if (node.external) Linking.openURL(node.external);
    else if (node.href) open(node.href);
  };
  const drillIn = (node: NavNode) => {
    setDirection('in');
    setPath((p) => [...p, node]);
  };
  const drillOut = () => {
    setDirection('out');
    setPath((p) => p.slice(0, -1));
  };

  const entering = (direction === 'in' ? SlideInRight : SlideInLeft).duration(260).reduceMotion(ReduceMotion.System);

  return (
    <SafeAreaView style={s.menuRoot} edges={['top', 'bottom']}>
      <View style={s.menuTop}>
        <Text style={s.brand}>NORTHBRIDGE</Text>
        <Pressable accessibilityLabel="Close menu" hitSlop={10} style={s.iconBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
      </View>

      <View style={s.utilityRow}>
        {utilityNav.map((u) => (
          <Pressable key={u.title} onPress={() => open(u.href)} hitSlop={6}>
            <Text style={s.utilityText}>{u.title}</Text>
          </Pressable>
        ))}
        <AccountLink onNavigate={open} />
        <PressableScale style={s.contactBtn} onPress={() => open('/contact')}>
          <Text style={s.contactText}>CONTACT</Text>
        </PressableScale>
      </View>

      <View style={s.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={colors.textMuted}
          style={s.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => goSearch(query, true)}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Animated.View key={path.map((p) => p.id).join('/') || 'root'} entering={entering}>
          {current ? (
            <>
              <Pressable onPress={drillOut} style={s.backRow} hitSlop={6}>
                <Ionicons name="chevron-back" size={18} color={colors.primary} />
                <Text style={s.backText}>{path.length > 1 ? path[path.length - 2].title : 'Menu'}</Text>
              </Pressable>
              <Pressable
                onPress={() => current.href && open(current.href)}
                disabled={!current.href}
                style={s.levelTitleRow}
              >
                <Text style={s.levelTitle}>{current.title}</Text>
                {current.href ? <Ionicons name="arrow-forward" size={20} color={colors.accent} /> : null}
              </Pressable>
            </>
          ) : null}

          {items.map((node, i) => (
            <Animated.View
              key={node.id}
              entering={FadeInDown.delay(60 + i * 30).duration(240).reduceMotion(ReduceMotion.System)}
            >
              <Pressable
                onPress={() => activate(node)}
                style={({ pressed }) => [s.menuItem, pressed && { backgroundColor: '#EEF2F7' }]}
              >
                <Text style={[s.menuItemText, !current && s.menuItemTop]}>{node.title}</Text>
                {node.children ? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} /> : null}
                {node.external ? <Ionicons name="open-outline" size={18} color={colors.textMuted} /> : null}
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Desktop navbar with mega-menu (wide web windows)
// ---------------------------------------------------------------------------

export function DesktopNav() {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const openNode = mainNav.find((n) => n.id === openId);
  const activeChild = openNode?.children?.find((c) => c.id === activeChildId) ?? openNode?.children?.[0];

  const close = () => setOpenId(null);
  const go = (href: Href) => {
    close();
    router.push(href);
  };
  const goNode = (node: NavNode) => {
    if (node.external) {
      close();
      Linking.openURL(node.external);
    } else if (node.href) go(node.href);
  };
  // The website uses two layouts: a two-column list (when items have sub-links) and a single grid of links.
  const twoLevel = !!openNode?.children?.some((c) => c.children);
  const toggle = (node: NavNode) => {
    if (!node.children) {
      if (node.href) go(node.href);
      return;
    }
    setActiveChildId(node.children[0]?.id ?? null);
    setOpenId((cur) => (cur === node.id ? null : node.id));
  };

  return (
    <View style={s.deskRoot}>
      {/* Utility bar */}
      <View style={s.deskUtility}>
        {utilityNav.map((u) => (
          <HoverLink key={u.title} label={u.title} onPress={() => go(u.href)} style={s.deskUtilityLink} />
        ))}
        {/* Language indicator (English only for now). */}
        <Text style={s.langText}>EN</Text>
        <AccountLink onNavigate={go} />

        <Pressable onPress={() => go('/contact')} style={({ hovered }) => [s.deskContact, hovered && { opacity: 0.9 }]}>
          <Text style={s.contactText}>CONTACT</Text>
        </Pressable>
      </View>

      {/* Main bar */}
      <View style={s.deskMain}>
        <Pressable onPress={() => go('/')} style={s.deskLogo}>
          <View style={s.logoMark}>
            <Text style={s.logoMarkText}>N</Text>
          </View>
          <View>
            <Text style={s.deskBrand}>NORTHBRIDGE</Text>
            <Text style={s.deskBrandSub}>ADVISORY</Text>
          </View>
        </Pressable>

        <View style={s.deskItems}>
          {mainNav.map((node) => {
            const isOpen = openId === node.id;
            const isCurrent = node.href ? pathname.startsWith(String(node.href)) : false;
            return (
              <Pressable key={node.id} onPress={() => toggle(node)} style={s.deskItem}>
                {({ hovered }) => (
                  <>
                    <Text style={[s.deskItemText, (isOpen || hovered || isCurrent) && { color: colors.accent }]}>{node.title}</Text>
                    {node.children ? (
                      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={isOpen ? colors.accent : colors.text} />
                    ) : null}
                  </>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={s.deskSearch}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            style={s.deskSearchInput}
            onSubmitEditing={() => {
              close();
              goSearch(query, false);
            }}
          />
        </View>
      </View>

      {/* Mega-menu panel */}
      {openNode?.children && !twoLevel ? (
        <>
          <Pressable style={s.deskScrim} onPress={close} accessibilityLabel="Close menu" />
          <Animated.View entering={FadeIn.duration(160)} style={[s.panel, s.panelGrid]}>
            <Pressable onPress={() => openNode.href && go(openNode.href)} style={[s.panelHeading, { paddingHorizontal: 0 }]}>
              <Text style={s.panelHeadingText}>{openNode.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
            <View style={s.gridLinks}>
              {openNode.children.map((child) => (
                <View key={child.id} style={s.gridLinkCell}>
                  <HoverLink label={child.title} onPress={() => goNode(child)} />
                  {child.external ? <Ionicons name="open-outline" size={14} color={colors.textMuted} /> : null}
                </View>
              ))}
            </View>
          </Animated.View>
        </>
      ) : null}

      {openNode?.children && twoLevel ? (
        <>
          <Pressable style={s.deskScrim} onPress={close} accessibilityLabel="Close menu" />
          <Animated.View entering={FadeIn.duration(160)} style={s.panel}>
            <View style={s.panelLeft}>
              <Pressable onPress={() => openNode.href && go(openNode.href)} style={s.panelHeading}>
                <Text style={s.panelHeadingText}>{openNode.title}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </Pressable>
              {openNode.children.map((child) => {
                const active = activeChild?.id === child.id;
                return (
                  <Pressable
                    key={child.id}
                    onHoverIn={() => setActiveChildId(child.id)}
                    onPress={() => (child.children ? setActiveChildId(child.id) : goNode(child))}
                    style={[s.panelLeftItem, active && s.panelLeftItemActive]}
                  >
                    <Text style={[s.panelLeftText, active && { color: colors.primaryLink }]}>{child.title}</Text>
                    {child.children ? <Ionicons name="chevron-forward" size={16} color={active ? colors.primaryLink : colors.text} /> : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={s.panelRight}>
              {activeChild ? (
                <Animated.View key={activeChild.id} entering={FadeIn.duration(140)}>
                  <Pressable onPress={() => activeChild.href && go(activeChild.href)} disabled={!activeChild.href}>
                    <Text style={s.panelRightTitle}>{activeChild.title}</Text>
                  </Pressable>
                  {(activeChild.children ?? []).map((leaf) => (
                    <HoverLink key={leaf.id} label={leaf.title} onPress={() => goNode(leaf)} style={s.panelRightLink} />
                  ))}
                  {!activeChild.children && activeChild.href ? (
                    <HoverLink label={`Go to ${activeChild.title} →`} onPress={() => go(activeChild.href!)} style={s.panelRightLink} />
                  ) : null}
                </Animated.View>
              ) : null}
            </View>

            {openNode.id === 'services' ? (
              <View style={s.featured}>
                <Text style={s.featuredTitle}>FEATURED</Text>
                {featuredLinks.map((f) => {
                  const insight = insights.find((i) => i.id === f.id);
                  return (
                    <Pressable key={f.id} onPress={() => go(f.href)} style={s.featuredCard}>
                      {({ hovered }) => (
                        <>
                          {insight ? (
                            <Image source={insightImage(insight)} style={s.featuredImage} contentFit="cover" />
                          ) : null}
                          <Text style={[s.featuredText, hovered && { color: colors.accent }]} numberOfLines={2}>
                            {f.title}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={colors.text} />
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

/** "Log in" when signed out; "Hi, name · Log out" when signed in. */
function AccountLink({ onNavigate }: { onNavigate: (href: Href) => void }) {
  const { user, signOut } = useAuth();
  if (!user) {
    return (
      <Pressable onPress={() => onNavigate('/login')} hitSlop={6} style={s.accountLink}>
        <Ionicons name="person-circle-outline" size={18} color={colors.text} />
        <Text style={s.accountText}>Log in</Text>
      </Pressable>
    );
  }
  return (
    <View style={s.accountLink}>
      <Ionicons name="person-circle" size={18} color={colors.primary} />
      <Text style={s.accountText} numberOfLines={1}>
        Hi, {user.name.split(' ')[0]}
      </Text>
      <Pressable onPress={signOut} hitSlop={6}>
        <Text style={[s.accountText, { color: colors.primaryLink }]}>Log out</Text>
      </Pressable>
    </View>
  );
}

function HoverLink({ label, onPress, style }: { label: string; onPress: () => void; style?: object }) {
  return (
    <Pressable onPress={onPress} style={style}>
      {({ hovered }) => (
        <Text style={[s.hoverLinkText, hovered && { color: colors.accent, textDecorationLine: 'underline' }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  iconBtn: { padding: 6 },

  // Mobile menu
  menuRoot: { flex: 1, backgroundColor: colors.surface },
  menuTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  brand: { color: colors.primary, fontWeight: '900', letterSpacing: 3, fontSize: 18 },
  utilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.md,
    rowGap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  utilityText: { fontSize: 14, fontWeight: '600', color: colors.text },
  contactBtn: { marginLeft: 'auto', backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 10 },
  contactText: { color: colors.onPrimary, fontWeight: '800', letterSpacing: 0.5, fontSize: 13 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F0F2F5',
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#F5F7FA',
  },
  levelTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  menuItemText: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  menuItemTop: { fontSize: 19, fontWeight: '700' },

  // Desktop nav
  deskRoot: { backgroundColor: colors.surface, zIndex: 100, borderBottomWidth: 1, borderColor: colors.border },
  deskUtility: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  deskUtilityLink: { paddingVertical: 12 },
  langText: { fontSize: 16, color: colors.text },
  accountLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accountText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  deskContact: { backgroundColor: colors.accent, paddingHorizontal: 28, paddingVertical: 14 },
  deskMain: { flexDirection: 'row', alignItems: 'center', height: 92, paddingLeft: 56 },
  deskLogo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoMark: { width: 44, height: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  logoMarkText: { color: colors.onPrimary, fontWeight: '900', fontSize: 24 },
  deskBrand: { color: colors.primary, fontWeight: '900', letterSpacing: 3, fontSize: 18 },
  deskBrandSub: { color: colors.accent, fontWeight: '700', letterSpacing: 4, fontSize: 11 },
  deskItems: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginLeft: 'auto', marginRight: spacing.xl },
  deskItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing.md },
  deskItemText: { fontSize: 16, fontWeight: '700', color: colors.text },
  deskSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    width: 300,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#F0F2F5',
  },
  deskSearchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 12 },
  deskScrim: { position: 'absolute', top: '100%', left: 0, right: 0, height: 4000, backgroundColor: 'rgba(11,37,69,0.25)' },
  panel: {
    position: 'absolute',
    top: '100%',
    left: 40,
    right: 300,
    minHeight: 460,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  panelLeft: { width: 400, backgroundColor: '#F0F2F5', paddingVertical: spacing.lg },
  panelHeading: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 36, paddingBottom: spacing.md },
  panelHeadingText: { fontSize: 22, fontWeight: '700', color: colors.text },
  panelLeftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    paddingVertical: 12,
  },
  panelLeftItemActive: { backgroundColor: colors.surface },
  panelLeftText: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  panelRight: { flex: 1, padding: spacing.xl, paddingLeft: 48 },
  panelGrid: { flexDirection: 'column', minHeight: 0, padding: 36, right: 300 },
  gridLinks: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md, marginTop: spacing.sm },
  gridLinkCell: { width: '33%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: spacing.md },
  featured: { width: 300, padding: spacing.lg, borderLeftWidth: 1, borderColor: colors.border },
  featuredTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, color: colors.text, marginBottom: spacing.md },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  featuredImage: { width: 56, height: 56, backgroundColor: '#E8EEF6' },
  featuredText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  panelRightTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  panelRightLink: { paddingVertical: 12 },
  hoverLinkText: { fontSize: 16, color: colors.text },
});
