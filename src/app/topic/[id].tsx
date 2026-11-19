import { Stack, useLocalSearchParams, type Href } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { ContentPage, type Crumb, type PageSection } from '@/components/page';
import { styles as ui } from '@/components/ui';
import { advisers, formatDate, industries, insights, type Insight, type Service } from '@/data/content';
import { aboutImage, careersImage, industryImages, insightImage, photoByKey, type PhotoSource } from '@/data/images';
import type { Topic } from '@/data/nav';
import { useCatalog } from '@/lib/catalog';
import { colors } from '@/theme';

/** Banner photo for pages in the Insights menu. */
const insightsImage = photoByKey('charts');

/** Which insight categories to show as related articles for each parent section. */
const relatedCategories: Record<string, Insight['category'][]> = {
  assurance: ['Audit', 'Risk'],
  tax: ['Tax'],
  advisory: ['Deals', 'Growth', 'Risk', 'Sustainability'],
  'managed-services': ['Growth', 'Tax'],
  digital: ['Digital', 'Risk'],
  'international-desk': ['Tax', 'Growth'],
};

/** Breadcrumb trail and photo for the section a topic sits under. */
function parentInfo(
  parent: Topic['parent'],
  services: Service[],
  serviceImage: (id: string) => PhotoSource,
): { crumbs: Crumb[]; title: string; image: PhotoSource } {
  if (parent.kind === 'service') {
    const s = services.find((x) => x.id === parent.id);
    const title = s?.title ?? 'Services';
    return {
      title,
      image: serviceImage(parent.id),
      crumbs: [{ title: 'Services', href: '/services' }, { title, href: `/service/${parent.id}` as Href }],
    };
  }
  if (parent.kind === 'industry') {
    const i = industries.find((x) => x.id === parent.id);
    const title = i?.title ?? 'Industries';
    return {
      title,
      image: industryImages[parent.id],
      crumbs: [{ title: 'Industries', href: '/industries' }, { title, href: `/industry/${parent.id}` as Href }],
    };
  }
  if (parent.kind === 'insights') {
    return { title: 'Insights', image: insightsImage, crumbs: [{ title: 'Insights', href: '/insights' }] };
  }
  return { title: 'About', image: aboutImage, crumbs: [{ title: 'About', href: '/about' }] };
}

/** Pages without long-form copy get a consistent two-section layout from their summary and points. */
function templateSections(topic: Topic, parentTitle: string): PageSection[] {
  return [
    { title: 'How we help', bullets: topic.points },
    {
      title: 'Why work with Northbridge',
      bullets: [
        `A dedicated ${parentTitle} team that knows your sector.`,
        'Partner-led advice with the same people year after year.',
        'Clear fees agreed up front, with no surprises.',
      ],
    },
  ];
}

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { services, topicById, serviceImage, loaded } = useCatalog();
  const topic = topicById(id);

  // Admin-added services arrive a moment after start-up.
  if (!topic && !loaded) {
    return (
      <View style={[ui.screen, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={ui.screen}>
        <Text style={ui.body}>Page not found.</Text>
      </View>
    );
  }

  const parent = parentInfo(topic.parent, services, serviceImage);
  // Side panel lists this page's own services; each row opens the contact form for that service.
  const offerings = topic.points.map((p) => ({
    title: p,
    href: { pathname: '/contact', params: { service: `${topic.title}: ${p}` } } as Href,
  }));

  // Key contact: the senior adviser in the parent service, if there is one.
  const parentService = topic.parent.kind === 'service' ? services.find((x) => x.id === topic.parent.id) : undefined;
  const adviser = advisers.find((a) => a.speciality === parent.title);
  // Admin-set leader for this page, else its main service's, else the senior adviser in that service.
  const leader = topic.leader ?? parentService?.leader ?? (adviser ? { name: adviser.name, role: adviser.role, office: adviser.office, email: adviser.email } : undefined);

  // Related insights: articles in the categories that fit this service, newest first.
  // Admin-added services have no mapping, so they show the latest articles from every category.
  const categories = relatedCategories[topic.parent.id];
  const related = insights
    .filter((i) => !categories || categories.includes(i.category))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
    .map((i) => ({ id: i.id, title: i.title, category: i.category, date: formatDate(i.date), image: insightImage(i) }));

  return (
    <>
      <Stack.Screen options={{ title: topic.title }} />
      <ContentPage
        key={topic.id}
        crumbs={[{ title: 'Home', href: '/' }, ...parent.crumbs, { title: topic.title }]}
        title={topic.title}
        subtitle={topic.summary}
        image={topic.image ? photoByKey(topic.image) : parent.image}
        headline={topic.page?.headline ?? 'Overview'}
        intro={
          topic.page?.intro ??
          topic.overview ??
          // Admin-added pages show only the admin's own words; built-in pages get the template sentence.
          (topic.custom
            ? topic.summary
            : `${topic.summary} Our ${parent.title} specialists work alongside your team to deliver support that is practical, proportionate and built around your business.`)
        }
        sections={
          topic.page?.sections ??
          (topic.custom
            ? topic.points.length
              ? [{ title: topic.parent.kind === 'service' ? 'How we help' : 'Key points', bullets: topic.points }]
              : []
            : templateSections(topic, parent.title))
        }
        sideTitle={`Our ${topic.title}`}
        // Added Insights / About pages list their key points in the page instead of a services box.
        sideLinks={topic.custom && topic.parent.kind !== 'service' ? undefined : offerings}
        contactTopic={topic.title}
        featureImage={careersImage}
        related={related}
        leader={leader}
        faqs={topic.page?.faqs}
      />
    </>
  );
}
