import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Footer, HeroCarousel, IndustriesRail, InsightsRail, OfficeBanner } from '@/components/home';
import { Card, CardImage, ScrollRevealProvider, SectionHeader, styles as ui, useReplayKey, useScrollTracker } from '@/components/ui';
import { heroSlides, industries, insights } from '@/data/content';
import { useCatalog } from '@/lib/catalog';
import { colors, spacing } from '@/theme';

/**
 * Home page, laid out like the reference website:
 * hero carousel → Insights carousel → Our services → Our industries → offices banner → footer.
 */
export default function HomeScreen() {
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();
  const { services, serviceImage } = useCatalog();

  // Reports and articles together, newest first.
  const latestInsights = [...insights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return (
    <ScrollRevealProvider value={scrollY}>
      <Animated.ScrollView
        key={replayKey}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ backgroundColor: colors.background }}
      >
        <HeroCarousel slides={heroSlides} pageScrollY={scrollY} />

        <View style={[s.section, { marginTop: spacing.lg }]}>
          <SectionHeader title="Insights" action="All insights" onAction={() => router.push('/insights')} />
          <Text style={[ui.muted, { marginBottom: spacing.sm }]}>Our latest thinking on the issues shaping business.</Text>
        </View>
        <InsightsRail reports={latestInsights} />

        <View style={[s.section, { marginTop: spacing.lg }]}>
          <SectionHeader title="Our services" action="See all" onAction={() => router.push('/services')} />
          <View style={s.grid}>
            {services.map((svc, i) => (
              <Card
                key={svc.id}
                index={i + 2}
                scrollReveal={false}
                containerStyle={s.gridCell}
                style={s.gridItem}
                onPress={() => router.push(`/service/${svc.id}`)}
              >
                <CardImage source={serviceImage(svc.id)} height={84} />
                <Text style={s.gridTitle}>{svc.title}</Text>
              </Card>
            ))}
          </View>
        </View>

        <View style={[s.section, { marginTop: spacing.lg }]}>
          <SectionHeader title="Our industries" action="See all" onAction={() => router.push('/industries')} />
          <Text style={[ui.muted, { marginBottom: spacing.sm }]}>Select an industry to see how we help.</Text>
        </View>
        <IndustriesRail items={industries} />

        <OfficeBanner />
        <Footer />
      </Animated.ScrollView>
    </ScrollRevealProvider>
  );
}

const s = StyleSheet.create({
  section: { paddingHorizontal: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridCell: { width: '48.5%' },
  gridItem: { flex: 1, minHeight: 150, overflow: 'hidden' },
  gridTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
});
