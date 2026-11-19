// Bundled stock photos (Unsplash licence). Bundled locally so they work offline and load instantly.
import type { EventItem, HeroSlide, Insight, NewsItem } from './content';

export const heroImage = require('../../assets/images/hero-city.jpg');
export const careersImage = require('../../assets/images/careers-team.jpg');
export const aboutImage = require('../../assets/images/about-globe.jpg');
export const sustainabilityImage = require('../../assets/images/sustainability-hands.jpg');
export const cyberImage = require('../../assets/images/cyber-lock.jpg');
export const officesBannerImage = require('../../assets/images/city-skyline.jpg');

export const heroSlideImages: Record<HeroSlide['image'], number> = {
  hero: heroImage,
  sustainability: require('../../assets/images/sustainability-solar.jpg'),
  risk: require('../../assets/images/insight-risk.jpg'),
  careers: require('../../assets/images/careers-young-team.jpg'),
  news: require('../../assets/images/news-city.jpg'),
  cyber: cyberImage,
  network: officesBannerImage,
  deals: require('../../assets/images/service-deals.jpg'),
};

export const serviceImages: Record<string, number> = {
  assurance: require('../../assets/images/service-audit.jpg'),
  tax: require('../../assets/images/service-tax.jpg'),
  advisory: require('../../assets/images/service-advisory.jpg'),
  'managed-services': require('../../assets/images/service-outsourcing.jpg'),
  digital: require('../../assets/images/service-cyber.jpg'),
  'international-desk': require('../../assets/images/about-globe.jpg'),
};

/** Photos an admin can pick for a service they add (stored by key in public.site_services.image). */
export const photoChoices: { key: string; label: string; source: number }[] = [
  { key: 'assurance', label: 'Audit', source: serviceImages.assurance },
  { key: 'tax', label: 'Tax', source: serviceImages.tax },
  { key: 'advisory', label: 'Advisory', source: serviceImages.advisory },
  { key: 'managed-services', label: 'Outsourcing', source: serviceImages['managed-services'] },
  { key: 'digital', label: 'Cyber', source: serviceImages.digital },
  { key: 'deals', label: 'Deals', source: require('../../assets/images/service-deals.jpg') },
  { key: 'esg', label: 'ESG', source: require('../../assets/images/service-esg.jpg') },
  { key: 'globe', label: 'Global', source: aboutImage },
  { key: 'city', label: 'City', source: heroImage },
  { key: 'skyline', label: 'Skyline', source: officesBannerImage },
  { key: 'team', label: 'Team', source: careersImage },
  { key: 'growth', label: 'Growth', source: require('../../assets/images/insight-growth.jpg') },
  { key: 'charts', label: 'Charts', source: require('../../assets/images/news-charts.jpg') },
  { key: 'digital-data', label: 'Data', source: require('../../assets/images/insight-digital.jpg') },
  { key: 'sustainability', label: 'Sustainability', source: require('../../assets/images/sustainability-solar.jpg') },
  { key: 'office', label: 'Office', source: require('../../assets/images/office-interior-1.jpg') },
];

/** A bundled photo, or a photo from a web link (uploaded by an admin or pasted). */
export type PhotoSource = number | { uri: string };

/** True when a stored image value is a web link rather than a photoChoices key. */
export const isPhotoLink = (value: string) => /^https?:\/\//i.test(value);

/** The photo for a photoChoices key or a web link, falling back to the Advisory photo. */
export const photoByKey = (key: string): PhotoSource =>
  isPhotoLink(key) ? { uri: key } : (photoChoices.find((p) => p.key === key)?.source ?? serviceImages.advisory);

/** Photos for the Insights sections in the menu. */
export const insightSectionImages: Record<string, number> = {
  alerts: require('../../assets/images/news-laptop.jpg'),
  blogs: require('../../assets/images/news-workspace.jpg'),
  'flyers-brochures': require('../../assets/images/news-charts.jpg'),
  'global-thought-leadership': require('../../assets/images/about-globe.jpg'),
  newsletters: require('../../assets/images/news-office.jpg'),
  publications: require('../../assets/images/insight-growth.jpg'),
  surveys: require('../../assets/images/sustainability-solar.jpg'),
  'ind-as-118': require('../../assets/images/insight-audit.jpg'),
};

const categoryImages: Record<Insight['category'], number> = {
  Tax: require('../../assets/images/insight-tax.jpg'),
  Deals: require('../../assets/images/insight-deals.jpg'),
  Risk: require('../../assets/images/insight-risk.jpg'),
  Growth: require('../../assets/images/insight-growth.jpg'),
  Audit: require('../../assets/images/insight-audit.jpg'),
  Sustainability: require('../../assets/images/sustainability-solar.jpg'),
  Digital: require('../../assets/images/insight-digital.jpg'),
};

/** Per-article overrides where the category photo isn't the best fit. */
const insightOverrides: Record<string, number> = {
  'telecoms-risk-2026': require('../../assets/images/insight-telecom.jpg'),
};

export function insightImage(insight: Pick<Insight, 'id' | 'category'>): number {
  return insightOverrides[insight.id] ?? categoryImages[insight.category];
}

export const industryImages: Record<string, number> = {
  'financial-services': require('../../assets/images/industry-financial.jpg'),
  manufacturing: require('../../assets/images/industry-manufacturing.jpg'),
  tmt: require('../../assets/images/industry-tmt.jpg'),
  'real-estate': require('../../assets/images/industry-real-estate.jpg'),
  healthcare: require('../../assets/images/industry-healthcare.jpg'),
  retail: require('../../assets/images/industry-retail.jpg'),
  energy: require('../../assets/images/industry-energy.jpg'),
  'public-sector': require('../../assets/images/industry-public-sector.jpg'),
  logistics: require('../../assets/images/industry-logistics.jpg'),
};

const newsImagesByCategory: Record<NewsItem['category'], number[]> = {
  'Firm news': [require('../../assets/images/news-city.jpg'), require('../../assets/images/news-office.jpg')],
  People: [require('../../assets/images/news-workspace.jpg')],
  Awards: [require('../../assets/images/news-charts.jpg'), require('../../assets/images/news-laptop.jpg')],
  Community: [require('../../assets/images/careers-young-team.jpg')],
};

export function newsImage(item: NewsItem, index: number): number {
  const list = newsImagesByCategory[item.category];
  return list[index % list.length];
}

const officeInteriors = [
  require('../../assets/images/office-interior-1.jpg'),
  require('../../assets/images/office-interior-2.jpg'),
  require('../../assets/images/office-interior-3.jpg'),
  require('../../assets/images/news-office.jpg'),
  require('../../assets/images/news-workspace.jpg'),
];

/** London gets a city photo; other offices rotate through office interiors. */
export function officeImage(city: string, index: number): number {
  if (city === 'London') return require('../../assets/images/office-london.jpg');
  return officeInteriors[index % officeInteriors.length];
}

export const eventImages: Record<EventItem['format'], number> = {
  Webinar: require('../../assets/images/event-webinar.jpg'),
  'In person': require('../../assets/images/event-in-person.jpg'),
};

/** An event's photo: the admin's uploaded/linked photo, or the default for its format. */
export function eventImage(item: Pick<EventItem, 'format' | 'image'>): PhotoSource {
  return item.image ? { uri: item.image } : eventImages[item.format];
}
