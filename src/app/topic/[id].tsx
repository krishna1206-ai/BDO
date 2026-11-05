import { Stack, useLocalSearchParams, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { ContentPage, type Crumb, type PageSection } from '@/components/page';
import { styles as ui } from '@/components/ui';
import { advisers, formatDate, industries, insights, services, type Insight } from '@/data/content';
import { aboutImage, careersImage, industryImages, insightImage, serviceImages } from '@/data/images';
import { topicById, type Topic } from '@/data/nav';

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
function parentInfo(parent: Topic['parent']): { crumbs: Crumb[]; title: string; image: number } {
  if (parent.kind === 'service') {
    const s = services.find((x) => x.id === parent.id);
    const title = s?.title ?? 'Services';
    return {
      title,
      image: serviceImages[parent.id],
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
  const topic = topicById(id);

  if (!topic) {
    return (
      <View style={ui.screen}>
        <Text style={ui.body}>Page not found.</Text>
      </View>
    );
  }

  const parent = parentInfo(topic.parent);
  // Side panel lists this page's own services; each row opens the contact form for that service.
  const offerings = topic.points.map((p) => ({
    title: p,
    href: { pathname: '/contact', params: { service: `${topic.title}: ${p}` } } as Href,
  }));

  // Key contact: the senior adviser in the parent service, if there is one.
  const leader = advisers.find((a) => a.speciality === parent.title);

  // Related insights: articles in the categories that fit this service, newest first.
  const categories = relatedCategories[topic.parent.id] ?? [];
  const related = insights
    .filter((i) => categories.includes(i.category))
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
        image={parent.image}
        headline={topic.page?.headline ?? 'Overview'}
        intro={
          topic.page?.intro ??
          `${topic.summary} Our ${parent.title} specialists work alongside your team to deliver support that is practical, proportionate and built around your business.`
        }
        sections={topic.page?.sections ?? templateSections(topic, parent.title)}
        sideTitle={`Our ${topic.title}`}
        sideLinks={offerings}
        contactTopic={topic.title}
        featureImage={careersImage}
        related={related}
        leader={leader ? { name: leader.name, role: leader.role, office: leader.office, email: leader.email } : undefined}
        faqs={topic.page?.faqs}
      />
    </>
  );
}
