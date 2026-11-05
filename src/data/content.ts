import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type Service = {
  id: string;
  title: string;
  icon: IconName;
  summary: string;
  description: string;
  offerings: string[];
};

export type Insight = {
  id: string;
  title: string;
  category: 'Tax' | 'Deals' | 'Risk' | 'Growth' | 'Audit' | 'Sustainability' | 'Digital';
  date: string;
  readMinutes: number;
  excerpt: string;
  body: string[];
  /** Flagship research shown in the "Featured reports" carousel. */
  report?: boolean;
};

export type Industry = {
  id: string;
  title: string;
  icon: IconName;
  summary: string;
  description: string;
  focus: string[];
  /** A headline figure for the sector, shown on the detail screen. */
  stat: { value: string; label: string };
};

export type NewsItem = {
  id: string;
  title: string;
  date: string;
  category: 'Firm news' | 'People' | 'Awards' | 'Community';
  excerpt: string;
  body: string[];
};

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  image: 'hero' | 'sustainability' | 'risk' | 'careers';
};

export type Stat = { value: number; suffix?: string; label: string };

export type CyberQuestion = { id: string; question: string; help: string; weight: number };

export type Adviser = {
  id: string;
  name: string;
  role: string;
  speciality: string;
  office: string;
  email: string;
  phone: string;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  format: 'Webinar' | 'In person';
  location: string;
  description: string;
};

export type Job = {
  id: string;
  title: string;
  team: string;
  location: string;
  type: 'Graduate' | 'Experienced' | 'Internship';
};

export type Office = {
  city: string;
  address: string;
  phone: string;
};

/** Firm name used in menu labels; change here to rebrand every label at once. */
export const BRAND = 'Northbridge';

export const services: Service[] = [
  {
    id: 'assurance',
    title: 'Assurance',
    icon: 'shield-checkmark-outline',
    summary: 'Independent audits and accounting advice that build trust with investors and regulators.',
    description:
      'Our assurance teams combine sector knowledge with data analytics to deliver high-quality, insightful audits, and help finance teams apply accounting standards with confidence.',
    offerings: [
      'Statutory and external audit',
      'Accounting advisory',
      'Internal audit',
      'ESG and sustainability assurance',
      'Attestation and agreed-upon procedures',
    ],
  },
  {
    id: 'tax',
    title: 'Tax',
    icon: 'calculator-outline',
    summary: 'Clear tax advice for businesses, owners and individuals.',
    description:
      'From corporate tax compliance to complex international structuring, our tax specialists help you manage risk, stay compliant and plan with confidence.',
    offerings: [
      'Corporate tax compliance',
      'VAT and indirect tax',
      'Private client and wealth planning',
      'R&D tax relief',
      'International and transfer pricing',
      'Employment taxes',
    ],
  },
  {
    id: 'advisory',
    title: 'Advisory',
    icon: 'trending-up-outline',
    summary: 'Deal, risk and strategy support to help you grow.',
    description:
      'Whether you are buying, selling, raising finance or transforming your operations, our advisers support you at every stage with practical, commercial advice.',
    offerings: [
      'Mergers & acquisitions',
      'Financial due diligence',
      'Restructuring and recovery',
      'Risk and cyber advisory',
      'Valuations',
      'Digital transformation',
    ],
  },
  {
    id: 'managed-services',
    title: 'Managed Services',
    icon: 'briefcase-outline',
    summary: 'Finance, payroll and admin handled so you can focus on growth.',
    description:
      'Free up your team with reliable outsourced finance functions. We handle the day-to-day so you get timely, accurate information to run your business.',
    offerings: [
      'Bookkeeping and management accounts',
      'Payroll services',
      'Company secretarial',
      'Outsourced CFO / FD',
      'Cloud accounting setup',
    ],
  },
  {
    id: 'digital',
    title: `${BRAND} Digital`,
    icon: 'hardware-chip-outline',
    summary: 'Technology, data and cyber security that move your business forward.',
    description:
      'Our digital team helps you choose and implement the right systems, get value from your data, and protect your people and information from cyber threats.',
    offerings: [
      'Technology strategy and ERP implementation',
      'Data analytics and AI',
      'Cyber security assessments and training',
      'Incident response',
      'Process automation',
    ],
  },
  {
    id: 'international-desk',
    title: 'International Desk',
    icon: 'globe-outline',
    summary: 'One point of contact for businesses expanding into or out of the country.',
    description:
      'Our international desk helps overseas businesses set up and operate locally, and helps local businesses expand abroad, coordinating tax, accounting and regulatory advice across borders.',
    offerings: [
      'Market entry and company set-up',
      'Cross-border tax structuring',
      'Transfer pricing',
      'Global payroll and compliance',
    ],
  },
];

export const insights: Insight[] = [
  {
    id: 'autumn-budget-2026',
    title: 'Autumn Budget 2026: what it means for your business',
    category: 'Tax',
    date: '2026-11-01',
    readMinutes: 6,
    excerpt: 'Our tax team breaks down the key announcements and the actions to consider now.',
    body: [
      'The Autumn Budget introduced several changes that will affect businesses and their owners over the next two years.',
      'Key areas to review include capital allowances, employer costs and changes to reliefs for business owners planning succession.',
      'We recommend reviewing your forecasts and speaking with an adviser before the new tax year to understand the impact on your plans.',
    ],
  },
  {
    id: 'mid-market-growth',
    title: 'Unlocking growth in the mid-market',
    category: 'Growth',
    date: '2026-07-15',
    readMinutes: 5,
    excerpt: 'Mid-sized businesses drive the economy. Here is what would help them grow faster.',
    body: [
      'Mid-sized firms make up a small share of businesses but a large share of employment and output.',
      'Access to finance, skills shortages and regulatory complexity remain the top barriers business leaders report.',
      'Targeted support in these areas could unlock significant additional growth across the regions.',
    ],
  },
  {
    id: 'risk-landscape-2026',
    title: 'The 2026 risk landscape',
    category: 'Risk',
    date: '2026-09-10',
    readMinutes: 8,
    report: true,
    excerpt: 'Cyber threats, supply chain disruption and regulation top the boardroom agenda.',
    body: [
      'Boards are facing a wider and faster-moving set of risks than ever before.',
      'Cyber security and data protection remain the most frequently cited concerns, followed by supply chain resilience.',
      'Organisations that invest in scenario planning are better placed to respond when disruption hits.',
    ],
  },
  {
    id: 'deal-outlook',
    title: 'Deal outlook: M&A activity picks up',
    category: 'Deals',
    date: '2026-10-05',
    readMinutes: 4,
    excerpt: 'Deal volumes are recovering as financing conditions improve.',
    body: [
      'After a slower period, transaction activity is picking up in the mid-market.',
      'Private equity firms have significant capital to deploy, and trade buyers are returning.',
      'Sellers who prepare early with robust financial information achieve better outcomes.',
    ],
  },
  {
    id: 'audit-reform',
    title: 'Preparing for audit reform',
    category: 'Audit',
    date: '2026-08-20',
    readMinutes: 5,
    excerpt: 'What the latest reform proposals mean for directors and finance teams.',
    body: [
      'Proposed reforms will place greater responsibility on directors for internal controls and reporting.',
      'Finance teams should start reviewing their control environment and documentation now.',
      'Early preparation will reduce cost and disruption when the new requirements take effect.',
    ],
  },
  {
    id: 'sustainability-survey-2026',
    title: 'From ambition to action: Sustainability Survey 2026',
    category: 'Sustainability',
    date: '2026-10-20',
    readMinutes: 9,
    report: true,
    excerpt: 'We asked 600 business leaders how far their sustainability plans have moved from pledge to practice.',
    body: [
      'Almost every business we surveyed now has a sustainability commitment, but fewer than half have a costed plan to deliver it.',
      'The leaders pulling ahead share three habits: they tie targets to executive pay, they measure supplier emissions, and they report progress every quarter rather than once a year.',
      'Customer expectations, not regulation, were the strongest driver of change for mid-sized firms.',
      'Our recommendations focus on small, practical steps: start with reliable data, pick two or three material issues, and build reporting into existing finance processes.',
    ],
  },
  {
    id: 'digital-edge-4',
    title: 'The digital edge, part 4: scaling AI responsibly',
    category: 'Digital',
    date: '2026-09-28',
    readMinutes: 7,
    report: true,
    excerpt: 'The final part of our series on how mid-sized businesses can move AI from pilots to everyday operations.',
    body: [
      'Most businesses have experimented with AI tools; far fewer have changed how work actually gets done.',
      'The firms seeing real returns started with one well-defined process, measured the baseline, and involved the people who do the work from day one.',
      'Good governance does not have to be heavy: a clear use policy, a register of tools, and regular reviews of data quality cover most of the risk.',
      'In this final chapter we bring the series together into a 90-day plan any leadership team can follow.',
    ],
  },
  {
    id: 'telecoms-risk-2026',
    title: 'Telecoms risk survey 2026',
    category: 'Risk',
    date: '2026-06-18',
    readMinutes: 6,
    report: true,
    excerpt: 'Network resilience, regulation and cyber threats top the list of risks for telecoms operators.',
    body: [
      'We reviewed the risk disclosures of leading telecoms operators to see what is keeping their boards awake at night.',
      'Cyber attacks and network outages remain the top concerns, but regulatory change and the cost of infrastructure upgrades are climbing fast.',
      'Operators that publish clear, specific risk disclosures tend to earn greater investor confidence.',
    ],
  },
  {
    id: 'ifrs-2027',
    title: 'IFRS reporting: what changes in 2027',
    category: 'Audit',
    date: '2026-05-30',
    readMinutes: 6,
    excerpt: 'New presentation rules will change how your income statement looks. Here is how to get ready.',
    body: [
      'New requirements for the presentation of financial statements will change the structure of the income statement and introduce new subtotals.',
      'Companies will also need to explain any management-defined performance measures they use in public communications.',
      'Finance teams should map their current reporting to the new categories now, so that systems and processes are ready well before the first reporting period.',
    ],
  },
];

export const industries: Industry[] = [
  {
    id: 'financial-services',
    title: 'Financial Services',
    icon: 'cash-outline',
    summary: 'Banks, insurers, asset managers and fintechs.',
    description:
      'Financial services firms face intense regulatory scrutiny and fast-moving technology change. We combine regulatory knowledge with practical audit, tax and advisory support.',
    focus: ['Regulatory reporting and assurance', 'Fintech growth and fundraising', 'Consumer duty reviews', 'Operational resilience'],
    stat: { value: '120+', label: 'regulated firms advised' },
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing',
    icon: 'construct-outline',
    summary: 'Engineering, industrial and advanced manufacturing.',
    description:
      'Manufacturers are balancing supply chain pressure, energy costs and investment in automation. We help you protect margins and plan for growth.',
    focus: ['R&D tax relief and capital allowances', 'Cost and margin improvement', 'Supply chain resilience', 'Succession and exit planning'],
    stat: { value: '£40m', label: 'R&D relief secured last year' },
  },
  {
    id: 'tmt',
    title: 'Technology, Media & Telecoms',
    icon: 'hardware-chip-outline',
    summary: 'Software, digital media and telecoms operators.',
    description:
      'From high-growth software businesses to established telecoms operators, we support TMT clients with funding, international expansion and complex revenue recognition.',
    focus: ['Revenue recognition for SaaS', 'Investor readiness', 'International expansion', 'Telecoms risk and regulation'],
    stat: { value: '300+', label: 'tech businesses supported' },
  },
  {
    id: 'real-estate',
    title: 'Real Estate & Construction',
    icon: 'business-outline',
    summary: 'Developers, investors, contractors and housing associations.',
    description:
      'Property and construction businesses deal with long project cycles, tight margins and complex tax rules. We help you structure, fund and report with confidence.',
    focus: ['Property tax structuring', 'Project and contract accounting', 'Fund and investor reporting', 'Building safety compliance'],
    stat: { value: '£2bn', label: 'property transactions advised' },
  },
  {
    id: 'healthcare',
    title: 'Healthcare & Life Sciences',
    icon: 'medkit-outline',
    summary: 'Care providers, clinics, pharma and medtech.',
    description:
      'Healthcare providers and life sciences companies face rising demand and tight funding. We help you improve efficiency, secure investment and stay compliant.',
    focus: ['Care sector audit and assurance', 'Life sciences fundraising', 'Grant and R&D claims', 'Operational efficiency'],
    stat: { value: '90+', label: 'healthcare organisations served' },
  },
  {
    id: 'retail',
    title: 'Retail & Consumer',
    icon: 'cart-outline',
    summary: 'Retailers, brands, leisure and hospitality.',
    description:
      'Consumer businesses are adapting to changing shopping habits and rising costs. We help you understand profitability by channel and plan for the next phase of growth.',
    focus: ['Channel profitability analysis', 'Stock and supply chain reviews', 'Restructuring support', 'International VAT'],
    stat: { value: '250+', label: 'consumer brands advised' },
  },
  {
    id: 'energy',
    title: 'Energy & Natural Resources',
    icon: 'flash-outline',
    summary: 'Renewables, utilities, mining and energy services.',
    description:
      'The energy transition is reshaping the sector. We support renewable developers, utilities and their supply chains with funding, tax and sustainability reporting.',
    focus: ['Renewable project finance', 'Energy transition strategy', 'Sustainability reporting', 'Capital allowances on green assets'],
    stat: { value: '1.5GW', label: 'renewable capacity advised on' },
  },
  {
    id: 'public-sector',
    title: 'Public Sector',
    icon: 'library-outline',
    summary: 'Local government, education and not-for-profit.',
    description:
      'Public bodies and charities must deliver more with less. We provide audit, internal audit and advisory support with a clear focus on value for money.',
    focus: ['External and internal audit', 'Value for money reviews', 'Charity governance', 'Grant assurance'],
    stat: { value: '150+', label: 'public bodies audited' },
  },
  {
    id: 'logistics',
    title: 'Transport & Logistics',
    icon: 'bus-outline',
    summary: 'Freight, warehousing, fleet and passenger transport.',
    description:
      'Logistics businesses run on thin margins and complex cross-border rules. We help with customs, fleet funding, decarbonisation and performance improvement.',
    focus: ['Customs and trade advice', 'Fleet funding and leasing', 'Decarbonisation plans', 'Performance improvement'],
    stat: { value: '60+', label: 'logistics clients' },
  },
];

export const news: NewsItem[] = [
  {
    id: 'new-managing-partner',
    title: 'Northbridge appoints Helen Carter as Managing Partner',
    date: '2026-10-01',
    category: 'People',
    excerpt: 'Helen Carter takes the helm with a plan to grow the firm’s regional presence and digital services.',
    body: [
      'Northbridge Advisory has appointed Helen Carter as Managing Partner, following a partner vote in September.',
      'Helen joined the firm as a graduate and has led our Advisory practice for the past six years.',
      '“Our clients are ambitious, and we need to be too,” said Helen. “I want Northbridge to be the first call for any growing business in the regions.”',
    ],
  },
  {
    id: 'deal-rankings-2025',
    title: 'Northbridge ranked a top-five mid-market deal adviser',
    date: '2026-02-12',
    category: 'Awards',
    excerpt: 'Our deal team advised on 74 completed transactions in 2025, placing us in the top five by volume.',
    body: [
      'Independent league tables published this week rank Northbridge among the five most active mid-market deal advisers in the UK.',
      'The team completed 74 transactions in 2025, with particular strength in technology, manufacturing and healthcare.',
      'The ranking reflects the hard work of our deal advisory, tax and due diligence teams across every office.',
    ],
  },
  {
    id: 'edinburgh-office',
    title: 'New Edinburgh office opens',
    date: '2026-06-03',
    category: 'Firm news',
    excerpt: 'Our second Scottish office brings 40 specialists closer to clients across the east of Scotland.',
    body: [
      'We have opened a new office in Edinburgh, our second in Scotland after Glasgow.',
      'The office will house 40 people at launch across audit, tax and advisory, with plans to double in size within three years.',
    ],
  },
  {
    id: 'charity-partnership',
    title: 'Three-year partnership with a youth skills charity',
    date: '2026-04-22',
    category: 'Community',
    excerpt: 'Our people will give 5,000 volunteering hours to help young people build financial skills.',
    body: [
      'Northbridge has launched a three-year partnership with a national youth skills charity.',
      'Our people will deliver money management workshops in schools and mentor young people starting their careers.',
    ],
  },
  {
    id: 'sustainability-report',
    title: 'We publish our first Impact Report',
    date: '2026-03-15',
    category: 'Firm news',
    excerpt: 'Our report sets out progress on emissions, inclusion and community impact.',
    body: [
      'Our first Impact Report shows a 22% reduction in our own emissions since 2022, driven by office energy changes and less air travel.',
      'It also sets new targets for inclusion at partner level and for community investment.',
    ],
  },
  {
    id: 'cyber-training-launch',
    title: 'New people-first cyber awareness training',
    date: '2025-11-18',
    category: 'Firm news',
    excerpt: 'Short, practical sessions that help staff spot and stop the attacks that target people.',
    body: [
      'Most successful cyber attacks start with a person, not a machine. Our new training helps staff recognise phishing, payment fraud and social engineering.',
      'Sessions are short, practical and tailored to each client’s real risks.',
    ],
  },
  {
    id: 'best-employer-2025',
    title: 'Named a top employer for trainees',
    date: '2025-09-09',
    category: 'Awards',
    excerpt: 'Trainees rated us highly for support, flexibility and career progression.',
    body: [
      'Northbridge has been named among the top employers for trainee accountants in an annual survey of students and graduates.',
      'Trainees highlighted the quality of study support and the chance to work with clients from their first week.',
    ],
  },
];

export const heroSlides: HeroSlide[] = [
  {
    id: 'growth',
    eyebrow: 'NORTHBRIDGE ADVISORY',
    title: 'Advice that helps your business grow.',
    text: 'Audit, tax and advisory services for ambitious mid-sized businesses and their owners.',
    cta: 'Talk to an adviser',
    href: '/contact',
    image: 'hero',
  },
  {
    id: 'sustainability',
    eyebrow: 'NEW RESEARCH',
    title: 'From ambition to action.',
    text: 'Our Sustainability Survey 2026 shows how leaders are turning pledges into progress.',
    cta: 'Read the survey',
    href: '/insight/sustainability-survey-2026',
    image: 'sustainability',
  },
  {
    id: 'risk',
    eyebrow: 'REPORT',
    title: 'The 2026 risk landscape.',
    text: 'Cyber, supply chains and regulation: what boards are watching this year.',
    cta: 'Explore the report',
    href: '/insight/risk-landscape-2026',
    image: 'risk',
  },
  {
    id: 'careers',
    eyebrow: 'CAREERS',
    title: 'Build what matters, with us.',
    text: 'Graduate, internship and experienced roles across the UK.',
    cta: 'See open roles',
    href: '/careers',
    image: 'careers',
  },
];

export const cyberQuestions: CyberQuestion[] = [
  { id: 'mfa', question: 'Do all staff use multi-factor authentication for email and remote access?', help: 'MFA blocks the vast majority of account takeover attacks.', weight: 3 },
  { id: 'backup', question: 'Are backups taken daily, kept offline, and restored in a test at least once a year?', help: 'Untested backups often fail when you need them most.', weight: 3 },
  { id: 'patch', question: 'Are security updates installed within two weeks of release?', help: 'Attackers move quickly once a weakness is published.', weight: 2 },
  { id: 'training', question: 'Have staff had cyber awareness training in the last 12 months?', help: 'Most attacks start with a convincing email or call.', weight: 2 },
  { id: 'plan', question: 'Do you have a written incident response plan that has been rehearsed?', help: 'A rehearsed plan cuts recovery time and cost.', weight: 2 },
  { id: 'payments', question: 'Are bank detail changes always verified by phone using a known number?', help: 'Payment diversion fraud is one of the costliest attacks on businesses.', weight: 3 },
];

export const legalSections: { title: string; body: string }[] = [
  {
    title: 'About this app',
    body: 'This is a demonstration app. Northbridge Advisory is a fictional firm, and all people, figures, contact details and articles are sample content.',
  },
  {
    title: 'Privacy',
    body: 'The demo does not collect or store personal data. In a live version, enquiries would be processed only to respond to you, kept for no longer than necessary and never sold to third parties.',
  },
  {
    title: 'Cookies and analytics',
    body: 'The app does not use cookies or tracking. A live version would ask for your consent before using any non-essential analytics.',
  },
  {
    title: 'Your rights',
    body: 'Under UK data protection law you can ask to see, correct or delete the personal data an organisation holds about you, and you can complain to the Information Commissioner’s Office.',
  },
  {
    title: 'Disclaimer',
    body: 'Articles are general information, not advice. Always speak to a qualified adviser about your specific circumstances before acting.',
  },
];

export const advisers: Adviser[] = [
  { id: '1', name: 'Sarah Mitchell', role: 'Partner', speciality: 'Assurance', office: 'London', email: 'sarah.mitchell@example.com', phone: '+44 20 0000 0001' },
  { id: '2', name: 'James Okafor', role: 'Tax Director', speciality: 'Tax', office: 'Manchester', email: 'james.okafor@example.com', phone: '+44 161 000 0002' },
  { id: '3', name: 'Priya Shah', role: 'Partner', speciality: 'Advisory', office: 'Birmingham', email: 'priya.shah@example.com', phone: '+44 121 000 0003' },
  { id: '4', name: 'Tom Reynolds', role: 'Senior Manager', speciality: 'Managed Services', office: 'Leeds', email: 'tom.reynolds@example.com', phone: '+44 113 000 0004' },
  { id: '5', name: 'Aisha Rahman', role: 'Director', speciality: 'Advisory', office: 'London', email: 'aisha.rahman@example.com', phone: '+44 20 0000 0005' },
  { id: '6', name: 'David Clarke', role: 'Partner', speciality: 'Tax', office: 'Bristol', email: 'david.clarke@example.com', phone: '+44 117 000 0006' },
  { id: '7', name: 'Emma Walsh', role: 'Audit Manager', speciality: 'Assurance', office: 'Glasgow', email: 'emma.walsh@example.com', phone: '+44 141 000 0007' },
  { id: '8', name: 'Ravi Patel', role: 'Partner', speciality: 'Advisory', office: 'London', email: 'ravi.patel@example.com', phone: '+44 20 0000 0008' },
  { id: '9', name: 'Fiona Grant', role: 'Director', speciality: `${BRAND} Digital`, office: 'Edinburgh', email: 'fiona.grant@example.com', phone: '+44 131 000 0009' },
  { id: '10', name: 'Owen Hughes', role: 'Senior Manager', speciality: 'International Desk', office: 'Cardiff', email: 'owen.hughes@example.com', phone: '+44 29 0000 0010' },
];

export const events: EventItem[] = [
  { id: 'e1', title: 'Autumn Budget briefing', date: '2026-11-12', format: 'Webinar', location: 'Online', description: 'Our tax partners walk through the Budget and answer your questions live.' },
  { id: 'e2', title: 'Selling your business: getting deal-ready', date: '2026-11-26', format: 'In person', location: 'Manchester', description: 'A practical session for owners considering an exit in the next three years.' },
  { id: 'e3', title: 'Cyber risk for boards', date: '2026-12-03', format: 'Webinar', location: 'Online', description: 'How directors can oversee cyber risk effectively.' },
  { id: 'e4', title: 'Year-end reporting update', date: '2026-12-10', format: 'In person', location: 'London', description: 'Key accounting changes finance teams need to know before year end.' },
  { id: 'e5', title: 'Net zero for mid-sized businesses', date: '2027-01-14', format: 'Webinar', location: 'Online', description: 'A practical first step guide to measuring and cutting your carbon footprint.' },
  { id: 'e6', title: 'Scaling AI in your finance team', date: '2027-01-28', format: 'In person', location: 'Edinburgh', description: 'Hear from finance leaders who have moved AI from pilot to everyday use.' },
];

export const jobs: Job[] = [
  { id: 'j1', title: 'Graduate Auditor', team: 'Audit & Assurance', location: 'London', type: 'Graduate' },
  { id: 'j2', title: 'Tax Trainee', team: 'Tax', location: 'Manchester', type: 'Graduate' },
  { id: 'j3', title: 'Summer Intern, Advisory', team: 'Advisory', location: 'Birmingham', type: 'Internship' },
  { id: 'j4', title: 'Transaction Services Manager', team: 'Advisory', location: 'London', type: 'Experienced' },
  { id: 'j5', title: 'Payroll Specialist', team: 'Business Services & Outsourcing', location: 'Leeds', type: 'Experienced' },
  { id: 'j6', title: 'Cyber Security Consultant', team: 'Cybersecurity', location: 'Manchester', type: 'Experienced' },
  { id: 'j7', title: 'Graduate, Sustainability & ESG', team: 'Sustainability & ESG', location: 'Bristol', type: 'Graduate' },
  { id: 'j8', title: 'Spring Insight Intern', team: 'All services', location: 'Glasgow', type: 'Internship' },
];

export const offices: Office[] = [
  { city: 'London', address: '1 Example Street, London EC1A 1AA', phone: '+44 20 0000 0000' },
  { city: 'Manchester', address: '2 Sample Road, Manchester M1 1AA', phone: '+44 161 000 0000' },
  { city: 'Birmingham', address: '3 Demo Square, Birmingham B1 1AA', phone: '+44 121 000 0000' },
  { city: 'Leeds', address: '4 Placeholder Way, Leeds LS1 1AA', phone: '+44 113 000 0000' },
  { city: 'Bristol', address: '5 Harbour Lane, Bristol BS1 1AA', phone: '+44 117 000 0000' },
  { city: 'Glasgow', address: '6 Sample Street, Glasgow G1 1AA', phone: '+44 141 000 0000' },
  { city: 'Edinburgh', address: '7 Demo Place, Edinburgh EH1 1AA', phone: '+44 131 000 0000' },
  { city: 'Cardiff', address: '8 Example Quay, Cardiff CF10 1AA', phone: '+44 29 0000 0000' },
];

export const stats: Stat[] = [
  { value: offices.length, label: 'UK offices' },
  { value: 2400, suffix: '+', label: 'people' },
  { value: 45, label: 'years in business' },
  { value: 9000, suffix: '+', label: 'clients' },
];

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
