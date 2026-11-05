import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Footer, HeroCarousel, IndustriesRail, OfficeBanner, ReportsRail, StatsBand } from '@/components/home';
import {
  Card,
  CardImage,
  PrimaryButton,
  ScrollRevealProvider,
  SectionHeader,
  Tag,
  styles as ui,
  useReplayKey,
  useScrollTracker,
} from '@/components/ui';
import { events, formatDate, heroSlides, industries, insights, news, services, stats } from '@/data/content';
import { cyberImage, eventImages, insightImage, newsImage, serviceImages, sustainabilityImage } from '@/data/images';
import { colors, radius, spacing } from '@/theme';

export default function HomeScreen() {
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();

  const byNewest = <T extends { date: string }>(list: T[]) => [...list].sort((a, b) => b.date.localeCompare(a.date));
  const reports = byNewest(insights.filter((i) => i.report));
  const latest = byNewest(insights.filter((i) => !i.report)).slice(0, 3);
  const latestNews = byNewest(news).slice(0, 2);
  const nextEvent = [...events].sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <ScrollRevealProvider value={scrollY}>
      <Animated.ScrollView
        key={replayKey}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ backgroundColor: colors.background }}
      >
        <HeroCarousel slides={heroSlides} pageScrollY={scrollY} />

        <StatsBand stats={stats} scrollY={scrollY} />

        <View style={s.section}>
          <SectionHeader title="Our services" action="See all" onAction={() => router.push('/services')} />
          <View style={s.grid}>
            {services.slice(0, 6).map((svc, i) => (
              <Card
                key={svc.id}
                index={i + 2}
                scrollReveal={false}
                containerStyle={s.gridCell}
                style={s.gridItem}
                onPress={() => router.push(`/service/${svc.id}`)}
              >
                <CardImage source={serviceImages[svc.id]} height={84} />
                <Text style={s.gridTitle}>{svc.title}</Text>
              </Card>
            ))}
          </View>
        </View>

        <View style={s.sectionHeaderPad}>
          <SectionHeader title="Featured reports" action="All insights" onAction={() => router.push('/insights')} />
        </View>
        <ReportsRail reports={reports} />

        <View style={s.sectionHeaderPad}>
          <SectionHeader title="Our industries" action="See all" onAction={() => router.push('/industries')} />
          <Text style={[ui.muted, { marginBottom: spacing.sm }]}>Select an industry to see how we help.</Text>
        </View>
        <IndustriesRail items={industries} />

        <View style={s.section}>
          <SectionHeader title="Latest insights" action="See all" onAction={() => router.push('/insights')} />
          {latest.map((item, i) => (
            <Card
              key={item.id}
              index={i}
              style={{ marginBottom: spacing.sm }}
              onPress={() => router.push(`/insight/${item.id}`)}
            >
              <View style={s.row}>
                <Image source={insightImage(item)} style={s.thumb} contentFit="cover" transition={250} />
                <View style={{ flex: 1 }}>
                  <Tag label={item.category} />
                  <Text style={s.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={ui.muted}>
                    {formatDate(item.date)} · {item.readMinutes} min read
                  </Text>
                </View>
              </View>
            </Card>
          ))}

          <SectionHeader title="Latest news" action="All news" onAction={() => router.push('/news')} />
          {latestNews.map((item, i) => (
            <Card
              key={item.id}
              index={i}
              style={{ marginBottom: spacing.sm, overflow: 'hidden' }}
              onPress={() => router.push(`/news/${item.id}`)}
            >
              <CardImage source={newsImage(item, i)} height={130} />
              <Tag label={item.category} />
              <Text style={s.cardTitle}>{item.title}</Text>
              <Text style={ui.muted}>{formatDate(item.date)}</Text>
            </Card>
          ))}

          {nextEvent ? (
            <>
              <SectionHeader title="Upcoming event" action="All events" onAction={() => router.push('/events')} />
              <Card index={0} style={s.darkCard} onPress={() => router.push('/events')}>
                <CardImage source={eventImages[nextEvent.format]} height={130} />
                <Text style={s.eventDate}>{formatDate(nextEvent.date)}</Text>
                <Text style={[s.cardTitle, { color: colors.onPrimary }]}>{nextEvent.title}</Text>
                <Text style={{ color: '#C9D4E3' }}>
                  {nextEvent.format} · {nextEvent.location}
                </Text>
              </Card>
            </>
          ) : null}

          <SectionHeader title="Tools & initiatives" />
          <Card index={0} style={[s.darkCard, { marginBottom: spacing.md }]} onPress={() => router.push('/cyber-check')}>
            <CardImage source={cyberImage} height={140} />
            <View style={s.row}>
              <Ionicons name="shield-half-outline" size={22} color={colors.accent} />
              <Text style={[s.cardTitle, { color: colors.onPrimary, flex: 1 }]}>Cyber Risk Check</Text>
            </View>
            <Text style={{ color: '#C9D4E3', marginBottom: spacing.md }}>
              Answer six quick questions and get an instant view of your cyber resilience.
            </Text>
            <PrimaryButton label="Start the check" icon="play-outline" onPress={() => router.push('/cyber-check')} />
          </Card>
          <Card index={1} style={{ overflow: 'hidden' }} onPress={() => router.push('/sustainability')}>
            <CardImage source={sustainabilityImage} height={140} />
            <View style={s.row}>
              <Ionicons name="leaf-outline" size={22} color={colors.accent} />
              <Text style={[s.cardTitle, { flex: 1 }]}>Sustainability at Northbridge</Text>
            </View>
            <Text style={ui.muted}>Our commitments, our progress, and how we help clients act. →</Text>
          </Card>
        </View>

        <OfficeBanner />
        <Footer />
      </Animated.ScrollView>
    </ScrollRevealProvider>
  );
}

const s = StyleSheet.create({
  section: { paddingHorizontal: spacing.md },
  sectionHeaderPad: { paddingHorizontal: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridCell: { width: '48.5%' },
  gridItem: { flex: 1, minHeight: 150, overflow: 'hidden' },
  gridTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  thumb: { width: 84, height: 84, borderRadius: radius.sm, backgroundColor: '#E8EEF6' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginVertical: 6 },
  darkCard: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight, overflow: 'hidden' },
  eventDate: { color: colors.accent, fontWeight: '700', fontSize: 13 },
});
