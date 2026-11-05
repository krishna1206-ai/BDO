import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { StatsBand } from '@/components/home';
import {
  Card,
  ListRow,
  ParallaxImage,
  Reveal,
  ScrollRevealProvider,
  SectionHeader,
  styles as ui,
  useReplayKey,
  useScrollTracker,
} from '@/components/ui';
import { stats, type IconName } from '@/data/content';
import { aboutImage } from '@/data/images';
import { colors, spacing } from '@/theme';

const values: { icon: IconName; title: string; text: string }[] = [
  { icon: 'chatbubble-ellipses-outline', title: 'Plain speaking', text: 'Clear advice without jargon, and honest answers even when they are not what you hoped to hear.' },
  { icon: 'people-outline', title: 'Partners who stay', text: 'The same team, year after year, who know your business and your ambitions.' },
  { icon: 'rocket-outline', title: 'Built for growth', text: 'We focus on ambitious mid-sized businesses, and we grow when they do.' },
];

export default function AboutScreen() {
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();

  return (
    <ScrollRevealProvider value={scrollY}>
      <Animated.ScrollView key={replayKey} contentContainerStyle={ui.screen} onScroll={onScroll} scrollEventThrottle={16}>
        <ParallaxImage source={aboutImage} scrollY={scrollY} />
        <Reveal index={0}>
          <Text style={ui.h1}>Independent, national, and close to you</Text>
        </Reveal>
        <Reveal index={1}>
          <Text style={[ui.body, { marginTop: spacing.md }]}>
            Northbridge Advisory is an independent firm of accountants and business advisers. For more than four decades we
            have helped owner-managed and mid-sized businesses grow, from their first audit to their eventual sale.
          </Text>
        </Reveal>

        <View style={{ marginHorizontal: -spacing.md }}>
          <StatsBand stats={stats} scrollY={scrollY} />
        </View>

        <SectionHeader title="What we stand for" />
        {values.map((v, i) => (
          <Card key={v.title} index={i} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name={v.icon} size={22} color={colors.accent} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{v.title}</Text>
            </View>
            <Text style={[ui.body, { color: colors.textMuted, marginTop: 6 }]}>{v.text}</Text>
          </Card>
        ))}

        <SectionHeader title="Find out more" />
        <ListRow index={3} icon="location-outline" title="Our offices" subtitle="Find a team near you" onPress={() => router.push('/offices')} />
        <ListRow index={4} icon="leaf-outline" title="Sustainability" subtitle="Our commitments and progress" onPress={() => router.push('/sustainability')} />
        <ListRow index={5} icon="newspaper-outline" title="News" subtitle="The latest from the firm" onPress={() => router.push('/news')} />
        <ListRow index={6} icon="school-outline" title="Careers" subtitle="Join the team" onPress={() => router.push('/careers')} />
      </Animated.ScrollView>
    </ScrollRevealProvider>
  );
}
