import { Stack, useLocalSearchParams, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ContentPage } from '@/components/page';
import { Reveal, styles as ui } from '@/components/ui';
import { industries } from '@/data/content';
import { industryImages } from '@/data/images';
import { topics } from '@/data/nav';
import { colors, spacing } from '@/theme';

export default function IndustryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const industry = industries.find((i) => i.id === id);

  if (!industry) {
    return (
      <View style={ui.screen}>
        <Text style={ui.body}>Industry not found.</Text>
      </View>
    );
  }

  const subTopics = topics.filter((x) => x.parent.kind === 'industry' && x.parent.id === industry.id);
  // Side panel: this industry's sub-sectors if it has them, otherwise the other industries.
  const sideLinks = subTopics.length
    ? subTopics.map((tp) => ({ title: tp.title, href: `/topic/${tp.id}` as Href }))
    : industries.map((i) => ({ title: i.title, href: `/industry/${i.id}` as Href, active: i.id === industry.id }));

  return (
    <>
      <Stack.Screen options={{ title: industry.title }} />
      <ContentPage
        key={industry.id}
        crumbs={[{ title: 'Home', href: '/' }, { title: 'Industries', href: '/industries' }, { title: industry.title }]}
        title={industry.title}
        image={industryImages[industry.id]}
        headline={industry.summary}
        intro={industry.description}
        sections={[
          { title: 'Where we focus', bullets: industry.focus },
          ...(subTopics.length
            ? [{ title: 'Sectors we serve', cards: subTopics.map((tp) => ({ title: tp.title, text: tp.summary })) }]
            : []),
        ]}
        sideLinks={sideLinks}
        contactTopic={industry.title}
      >
        <Reveal index={5} style={s.stat}>
          <Text style={s.statValue}>{industry.stat.value}</Text>
          <Text style={s.statLabel}>{industry.stat.label}</Text>
        </Reveal>
      </ContentPage>
    </>
  );
}

const s = StyleSheet.create({
  stat: { marginTop: spacing.xl, padding: spacing.lg, borderLeftWidth: 5, borderLeftColor: colors.accent, backgroundColor: '#F5F6F8' },
  statValue: { color: colors.primary, fontSize: 36, fontWeight: '800' },
  statLabel: { color: colors.text, fontSize: 15, marginTop: 2 },
});
