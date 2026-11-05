import { Stack, router, useLocalSearchParams, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { ContentPage } from '@/components/page';
import { Card, CardImage, Tag, styles as ui } from '@/components/ui';
import { formatDate, insights } from '@/data/content';
import { insightImage, insightSectionImages } from '@/data/images';
import { insightSections } from '@/data/nav';
import { colors, spacing } from '@/theme';

/** One Insights section from the menu (Alerts, Blogs, …): intro, side navigation and matching articles. */
export default function InsightSectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const section = insightSections.find((x) => x.id === id);

  if (!section) {
    return (
      <View style={ui.screen}>
        <Text style={ui.body}>Section not found.</Text>
      </View>
    );
  }

  const items = insights
    .filter((i) => (section.reportsOnly ? i.report : section.categories.includes(i.category)))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Stack.Screen options={{ title: section.title }} />
      <ContentPage
        key={section.id}
        crumbs={[{ title: 'Home', href: '/' }, { title: 'Insights', href: '/insights' }, { title: section.title }]}
        title={section.title}
        image={insightSectionImages[section.id]}
        headline={section.title}
        intro={section.intro}
        sections={[]}
        sideLinks={insightSections.map((x) => ({
          title: x.title,
          href: `/insights-section/${x.id}` as Href,
          active: x.id === section.id,
        }))}
        contactTopic={section.title}
      >
        <View style={{ marginTop: spacing.xl }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.md }}>
            Latest {section.title.toLowerCase()}
          </Text>
          {items.length === 0 ? <Text style={ui.muted}>Nothing published here yet.</Text> : null}
          {items.map((item, i) => (
            <Card
              key={item.id}
              index={i}
              style={{ marginBottom: spacing.md, overflow: 'hidden' }}
              onPress={() => router.push(`/insight/${item.id}`)}
            >
              <CardImage source={insightImage(item)} height={140} />
              <Tag label={item.category} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginVertical: 6 }}>{item.title}</Text>
              <Text style={[ui.body, { color: colors.textMuted }]}>{item.excerpt}</Text>
              <Text style={[ui.muted, { marginTop: spacing.sm }]}>
                {formatDate(item.date)} · {item.readMinutes} min read
              </Text>
            </Card>
          ))}
        </View>
      </ContentPage>
    </>
  );
}
