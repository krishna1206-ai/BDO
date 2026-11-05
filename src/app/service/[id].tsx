import { Stack, useLocalSearchParams, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ContentPage } from '@/components/page';
import { Reveal, styles as ui } from '@/components/ui';
import { advisers, services } from '@/data/content';
import { serviceImages } from '@/data/images';
import { topics } from '@/data/nav';
import { colors, spacing } from '@/theme';

export default function ServiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const service = services.find((s) => s.id === id);

  if (!service) {
    return (
      <View style={ui.screen}>
        <Text style={ui.body}>Service not found.</Text>
      </View>
    );
  }

  const experts = advisers.filter((a) => a.speciality === service.title);
  const subTopics = topics.filter((x) => x.parent.kind === 'service' && x.parent.id === service.id);

  return (
    <>
      <Stack.Screen options={{ title: service.title }} />
      <ContentPage
        key={service.id}
        crumbs={[{ title: 'Home', href: '/' }, { title: 'Services', href: '/services' }, { title: service.title }]}
        title={service.title}
        image={serviceImages[service.id]}
        headline={service.summary}
        intro={service.description}
        sections={[
          { title: 'How we can help', bullets: service.offerings },
          ...(subTopics.length
            ? [
                {
                  title: `Explore ${service.title}`,
                  cards: subTopics.map((tp) => ({ title: tp.title, text: tp.summary })),
                },
              ]
            : []),
        ]}
        sideLinks={subTopics.map((tp) => ({ title: tp.title, href: `/topic/${tp.id}` as Href }))}
        contactTopic={service.title}
      >
        {experts.length > 0 ? (
          <Reveal index={6} style={{ marginTop: spacing.xl }}>
            <Text style={s.title}>Key contacts</Text>
            <View style={s.contacts}>
              {experts.map((a) => (
                <View key={a.id} style={s.contact}>
                  <Text style={s.name}>{a.name}</Text>
                  <Text style={ui.muted}>
                    {a.role} · {a.office}
                  </Text>
                </View>
              ))}
            </View>
          </Reveal>
        ) : null}
      </ContentPage>
    </>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  contacts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  contact: { minWidth: 220, flexGrow: 1, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
});
