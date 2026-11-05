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
};

export const serviceImages: Record<string, number> = {
  assurance: require('../../assets/images/service-audit.jpg'),
  tax: require('../../assets/images/service-tax.jpg'),
  advisory: require('../../assets/images/service-advisory.jpg'),
  'managed-services': require('../../assets/images/service-outsourcing.jpg'),
  digital: require('../../assets/images/service-cyber.jpg'),
  'international-desk': require('../../assets/images/about-globe.jpg'),
};

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

export const eventImages: Record<EventItem['format'], number> = {
  Webinar: require('../../assets/images/event-webinar.jpg'),
  'In person': require('../../assets/images/event-in-person.jpg'),
};

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
