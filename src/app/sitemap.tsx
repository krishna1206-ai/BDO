import { router, type Href } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ListRow, SectionHeader, styles as ui, useReplayKey } from '@/components/ui';
import type { IconName } from '@/data/content';

const groups: { title: string; links: { icon: IconName; title: string; href: Href }[] }[] = [
  {
    title: 'What we do',
    links: [
      { icon: 'grid-outline', title: 'Services', href: '/services' },
      { icon: 'business-outline', title: 'Industries', href: '/industries' },
      { icon: 'shield-half-outline', title: 'Cyber Risk Check', href: '/cyber-check' },
    ],
  },
  {
    title: 'Insights & news',
    links: [
      { icon: 'newspaper-outline', title: 'Insights & reports', href: '/insights' },
      { icon: 'megaphone-outline', title: 'News', href: '/news' },
      { icon: 'calendar-outline', title: 'Events', href: '/events' },
    ],
  },
  {
    title: 'About us',
    links: [
      { icon: 'globe-outline', title: 'About Northbridge', href: '/about' },
      { icon: 'people-outline', title: 'Advisers', href: '/advisers' },
      { icon: 'leaf-outline', title: 'Sustainability', href: '/sustainability' },
      { icon: 'school-outline', title: 'Careers', href: '/careers' },
      { icon: 'location-outline', title: 'Offices', href: '/offices' },
    ],
  },
  {
    title: 'Help & legal',
    links: [
      { icon: 'mail-outline', title: 'Contact us', href: '/contact' },
      { icon: 'warning-outline', title: 'Fraud alert', href: '/fraud-alert' },
      { icon: 'document-text-outline', title: 'Legal, privacy & cookies', href: '/legal' },
    ],
  },
];

export default function SitemapScreen() {
  const replayKey = useReplayKey();
  return (
    <ScrollView key={replayKey} contentContainerStyle={ui.screen}>
      {groups.map((group, g) => {
        // Continue the stagger across groups.
        const offset = groups.slice(0, g).reduce((sum, prev) => sum + prev.links.length, 0);
        return (
          <View key={group.title}>
            <SectionHeader title={group.title} />
            {group.links.map((link, i) => (
              <ListRow
                key={link.title}
                index={offset + i}
                icon={link.icon}
                title={link.title}
                onPress={() => router.push(link.href)}
              />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}
