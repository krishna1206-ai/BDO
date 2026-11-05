import { router } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { ListRow, SectionHeader, styles as ui, useReplayKey } from '@/components/ui';
import { spacing } from '@/theme';

export default function MoreScreen() {
  const replayKey = useReplayKey();
  return (
    <ScrollView key={replayKey} contentContainerStyle={ui.screen}>
      <SectionHeader title="Explore" />
      <ListRow index={0} icon="business-outline" title="Industries" subtitle="Sector specialists" onPress={() => router.push('/industries')} />
      <ListRow index={1} icon="megaphone-outline" title="News" subtitle="The latest from the firm" onPress={() => router.push('/news')} />
      <ListRow index={2} icon="shield-half-outline" title="Cyber Risk Check" subtitle="Six questions, instant result" onPress={() => router.push('/cyber-check')} />
      <ListRow index={3} icon="leaf-outline" title="Sustainability" subtitle="Our goals and progress" onPress={() => router.push('/sustainability')} />

      <SectionHeader title="Get involved" />
      <ListRow index={4} icon="calendar-outline" title="Events" subtitle="Webinars and seminars" onPress={() => router.push('/events')} />
      <ListRow index={5} icon="school-outline" title="Careers" subtitle="Graduate and experienced roles" onPress={() => router.push('/careers')} />

      <SectionHeader title="About & contact" />
      <ListRow index={6} icon="globe-outline" title="About us" subtitle="Who we are and what we stand for" onPress={() => router.push('/about')} />
      <ListRow index={7} icon="mail-outline" title="Contact us" subtitle="Send us an enquiry" onPress={() => router.push('/contact')} />
      <ListRow index={8} icon="location-outline" title="Our offices" subtitle="Find an office near you" onPress={() => router.push('/offices')} />

      <SectionHeader title="Legal & help" />
      <ListRow index={9} icon="warning-outline" title="Fraud alert" subtitle="How to spot scams using our name" onPress={() => router.push('/fraud-alert')} />
      <ListRow index={10} icon="document-text-outline" title="Legal, privacy & cookies" onPress={() => router.push('/legal')} />
      <ListRow index={11} icon="map-outline" title="Sitemap" subtitle="Every page in the app" onPress={() => router.push('/sitemap')} />

      <Text style={[ui.muted, { textAlign: 'center', marginTop: spacing.xl }]}>
        Northbridge Advisory · Demo app v1.1.0{'\n'}All people, figures and contact details are sample data.
      </Text>
    </ScrollView>
  );
}
