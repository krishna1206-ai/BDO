import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  Card,
  ParallaxImage,
  PrimaryButton,
  ProgressBar,
  Reveal,
  ScrollRevealProvider,
  SectionHeader,
  styles as ui,
  useReplayKey,
  useScrollTracker,
} from '@/components/ui';
import type { IconName } from '@/data/content';
import { sustainabilityImage } from '@/data/images';
import { colors, spacing } from '@/theme';

const goals: { icon: IconName; title: string; target: string; progress: number; note: string }[] = [
  { icon: 'cloud-outline', title: 'Cut our own emissions 50% by 2030', target: '50%', progress: 0.44, note: '22% reduction achieved since 2022' },
  { icon: 'flash-outline', title: '100% renewable electricity in our offices', target: '100%', progress: 7 / 8, note: '7 of 8 offices on renewable tariffs' },
  { icon: 'people-outline', title: '40% women at partner level by 2030', target: '40%', progress: 0.7, note: 'Currently 28% of partners' },
  { icon: 'heart-outline', title: '5,000 volunteering hours a year', target: '5,000', progress: 0.62, note: '3,100 hours given this year so far' },
];

export default function SustainabilityScreen() {
  const replayKey = useReplayKey();
  const { scrollY, onScroll } = useScrollTracker();

  return (
    <ScrollRevealProvider value={scrollY}>
      <Animated.ScrollView key={replayKey} contentContainerStyle={ui.screen} onScroll={onScroll} scrollEventThrottle={16}>
        <ParallaxImage source={sustainabilityImage} scrollY={scrollY} />
        <Reveal index={0}>
          <Text style={ui.h1}>Sustainability at Northbridge</Text>
        </Reveal>
        <Reveal index={1}>
          <Text style={[ui.body, { marginTop: spacing.md }]}>
            We hold ourselves to the same standards we help our clients meet. Here is where we are against the goals in our
            Impact Report.
          </Text>
        </Reveal>

        <SectionHeader title="Our goals and progress" />
        {goals.map((g, i) => (
          <Card key={g.title} index={i} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <Ionicons name={g.icon} size={22} color={colors.accent} />
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}>{g.title}</Text>
            </View>
            <View style={{ marginTop: spacing.md }}>
              <ProgressBar value={g.progress} delay={300 + i * 150} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={ui.muted}>{g.note}</Text>
              <Text style={[ui.muted, { fontWeight: '700' }]}>{Math.round(g.progress * 100)}%</Text>
            </View>
          </Card>
        ))}

        <SectionHeader title="Helping clients act" />
        <Card index={4}>
          <Text style={ui.body}>
            Our Sustainability & ESG team helps businesses measure their footprint, set credible targets and report with
            confidence.
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <PrimaryButton label="Explore our Advisory services" icon="leaf-outline" onPress={() => router.push('/service/advisory')} />
          </View>
        </Card>
        <Card index={5} style={{ marginTop: spacing.sm }} onPress={() => router.push('/insight/sustainability-survey-2026')}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Read our Sustainability Survey 2026 →</Text>
        </Card>
      </Animated.ScrollView>
    </ScrollRevealProvider>
  );
}
