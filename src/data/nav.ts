import type { Href } from "expo-router";

import { BRAND, services } from "./content";

/** A detail page reached from the menu that sits below a service, industry or About section. */
export type Topic = {
  id: string;
  title: string;
  summary: string;
  points: string[];
  /** Which top-level page this topic belongs to (used for its photo and breadcrumb). */
  parent: { kind: "service" | "industry" | "about"; id: string };
  /** Optional long-form page content; pages without it use a template built from summary and points. */
  page?: {
    headline: string;
    /** One string per paragraph (or a single string). */
    intro: string | string[];
    sections: {
      title: string;
      body?: string[];
      bullets?: string[];
      /** Rendered as a grid of cards (e.g. pillars, tools). */
      cards?: { title: string; text: string; icon?: string }[];
      /** 'pillars': accent headings on a diagonal shape, no box. 'boxes' (default): grey boxes. */
      cardStyle?: "pillars" | "boxes" | "feature";
      /** Text shown after the cards or bullets. */
      after?: string[];
    }[];
    /** Expandable questions and answers at the end of the page. */
    faqs?: { q: string; a: string }[];
  };
};

/** Long-form content for topics that have a full page. Original sample copy for the demo firm. */
const pages: Record<string, NonNullable<Topic["page"]>> = {
  "audit-attestation": {
    headline: "Overview",
    // CLIENT CONTENT SLOT (Financial Statement Audit and Attestation Services):
    // replace the [] below with the client's approved Overview paragraphs, one string per paragraph.
    intro: [],
    sections: [
      {
        title: "Where our investment goes",
        body: [
          "The evolving regulatory landscape and heightened importance of financial reporting necessitate companies to navigate complex professional requirements and ensure compliance with regulations. With an understanding of the company’s financial information becoming widely recognised, clarity, agility and reliability are highly needed for the financial information.",
        ],
        cardStyle: "pillars",
        cards: [
          {
            icon: "git-network-outline",
            title: "One connected toolkit",
            text: "Every office and every audit team works in the same tools, so a small client gets the same capability as our largest.",
          },
          {
            icon: "layers-outline",
            title: "Built into the workflow",
            text: "New tools sit inside the steps auditors already follow, not in a separate system, so they actually get used.",
          },
          {
            icon: "sparkles-outline",
            title: "Analytics and AI, with oversight",
            text: "Pattern-finding and text-reading tools speed up review, and an experienced auditor checks every conclusion.",
          },
          {
            icon: "telescope-outline",
            title: "Tested before trusted",
            text: "A small lab team trials new technology on past files before anything reaches a live client audit.",
          },
        ],
      },
      {
        title: "Improving every audit season",
        body: [
          "We review our tools after every busy season, using feedback from our auditors, our clients and regulators’ inspection findings. Each round of changes aims for three results:",
        ],
        bullets: [
          "Quicker responses when a new risk appears in your sector.",
          "Fewer, clearer information requests and more visibility of what we are doing.",
          "The same high standard on every file, checked by built-in quality controls.",
        ],
      },
      {
        title: "The tools behind our audits",
        body: [
          "Every engagement uses the same set of tools, from planning through to sign-off:",
        ],
        cards: [
          {
            icon: "folder-open-outline",
            title: "Audit Workspace",
            text: "Our cloud audit file: planning, risk assessment, testing and review in one secure place.",
          },
          {
            icon: "people-outline",
            title: "Client Portal",
            text: "Share documents securely, track open requests and see audit progress at any time.",
          },
          {
            icon: "analytics-outline",
            title: "Ledger Analytics",
            text: "Tests every journal and transaction to highlight unusual items, duplicates and timing issues.",
          },
          {
            icon: "bar-chart-outline",
            title: "Insight Dashboards",
            text: "Turn audit findings into clear visual summaries for finance teams and audit committees.",
          },
          {
            icon: "pulse-outline",
            title: "Year-round Monitoring",
            text: "Optional quarterly data checks that flag issues early instead of waiting for year end.",
          },
          {
            icon: "shield-checkmark-outline",
            title: "Quality Tracker",
            text: "Monitors our own quality controls across every engagement and reports to our Audit Quality Committee.",
          },
        ],
        after: [
          "Client data is encrypted, held in UK data centres and seen only by the people working on your audit. We never use client data to train public AI models.",
        ],
      },
    ],
  },
  "corporate-tax-services": {
    headline: "Overview",
    // CLIENT CONTENT SLOT (Corporate Tax Services):
    // replace the [] below with the client's approved Overview paragraphs, one string per paragraph.
    intro: ['Taxation has evolved beyond compliance. It is now a strategic driver of business performance and growth. With frequent regulatory changes, evolving judicial interpretations, and increasing globalisation, businesses face mounting challenges in maintaining tax efficiency while complying with complex domestic and international tax laws. The absence of proactive planning can lead to missed opportunities, higher tax costs, and potential compliance risks.',
      'BDO India helps transform complex tax regulations into actionable strategies that create value, optimise efficiency, and support long-term sustainability. With deep technical knowledge, commercial understanding, and a global perspective, our professionals enable businesses to make informed decisions and plan with confidence.',
      'We assist businesses in addressing complex tax challenges by identifying potential risks and inefficiencies in their operations and cross-border transactions. Our team evaluates organisational structures and proposed deals to prevent costly errors, identifies opportunities for sector-specific benefits, and ensures regulatory compliance. By guiding clients through compliance requirements and government schemes, we help mitigate uncertainties, minimise liabilities, and enable informed strategic decisions.',
    ],
    sections: [],
  },
  "accounting-advisory": {
    headline: "Overview",
    // CLIENT CONTENT SLOT: paste the client's approved Overview paragraphs here, one string per paragraph:
    intro: [
      "Navigating accounting and financial reporting complexities can be challenging amid business transformations, internal restructures, multi-geography expansions, unique transactions, fundraising, and mergers & acquisitions. As organisations evolve, finance teams face heightened expectations, not only to ensure compliance with Ind AS, IFRS, or US GAAP, but also to deliver timely, accurate, and insight-driven reporting that supports strategic decisions. The ability to adapt to new regulations while maintaining governance and transparency has become a critical differentiator.",
      "Frequent changes in financial accounting standards, complex consolidation requirements, and the need for transparent disclosures place significant pressure on finance leaders. Inconsistent interpretation of standards, inefficient reporting systems, or delayed filings can lead to compliance lapses, reputational risks, and erosion of stakeholder trust. As businesses expand across borders and sectors, the challenge lies in ensuring accuracy, comparability, and consistency in financial reporting—without compromising agility or insight.",
      "BDO India’s Accounting Advisory Services (AAS) provide finance teams with tailored, technically sound financial accounting and reporting services. Our specialists combine deep subject-matter expertise with practical implementation experience to help clients interpret complex standards, strengthen reporting processes, and align operations with evolving regulatory frameworks. From designing robust accounting structures to supporting transaction-driven requirements, we help organisations build finance functions that are compliant, agile, and trusted, enabling leaders to focus on performance, growth, and governance.",
    ],
    sections: [
      {
        title: "How we can help",
        body: [
          "We focus on better-quality reporting, a smoother month-end close, and finance teams with more time for analysis.",
        ],
        cardStyle: "feature",
        cards: [
          {
            icon: "school-outline",
            title: "Technical depth",
            text: "Specialists who follow standard-setters closely and turn complex rules into clear, practical positions.",
          },
          {
            icon: "time-outline",
            title: "On-time reporting",
            text: "Planning and hands-on support so filings, board packs and audit deliverables land when they should.",
          },
          {
            icon: "globe-outline",
            title: "Connected expertise",
            text: "Tax, legal and regulatory colleagues on call when an accounting question touches other areas.",
          },
          {
            icon: "apps-outline",
            title: "End-to-end support",
            text: "From a single technical paper to a full conversion programme or finance transformation.",
          },
          {
            icon: "speedometer-outline",
            title: "Readiness scorecard",
            text: "A quick assessment of how new presentation and disclosure requirements will affect your reporting, with a prioritised plan.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "When should we involve accounting advisers?",
        a: "Ideally before a significant transaction is signed or a new standard takes effect. Early involvement lets you shape the deal or the reporting approach, rather than fixing issues after the event.",
      },
      {
        q: "Can you work alongside our auditors?",
        a: "Yes. We help you form and document your own position, which your auditors then review. Where we are your auditor, independence rules limit the advisory services we can offer, and we will tell you up front.",
      },
      {
        q: "Do you support conversions between reporting frameworks?",
        a: "Yes. We plan the conversion, identify differences, restate comparatives, update policies and train your team so the new framework becomes business as usual.",
      },
      {
        q: "How is the work priced?",
        a: "Most engagements are fixed-fee and agreed before work starts. For ongoing support we offer a retainer with a set number of hours each month.",
      },
    ],
  },
};

const t = (
  parent: Topic["parent"],
  id: string,
  title: string,
  summary: string,
  points: string[],
): Topic => ({ id, title, summary, points, parent, page: pages[id] });

const svc = (id: string) => ({ kind: "service" as const, id });
const ind = (id: string) => ({ kind: "industry" as const, id });
const about = { kind: "about" as const, id: "about" };

export const topics: Topic[] = [
  // Tax (menu labels mirror the client website; summaries and points are original sample copy)
  t(
    svc("tax"),
    "corporate-tax-services",
    "Corporate Tax Services",
    "",
    [
      "Tax returns and advance tax",
      "Structuring and restructuring",
      "Tax risk reviews",
      "Assessments and appeals support",
    ],
  ),
  t(
    svc("tax"),
    "financial-services-tax",
    "Financial Services Tax",
    "Specialist tax support for banks, insurers, funds and fintechs.",
    [
      "Fund and product structuring",
      "Withholding and treaty reviews",
      "Regulatory tax reporting",
      "Transaction tax advice",
    ],
  ),
  t(
    svc("tax"),
    "global-employer-services",
    "Global Employer Services",
    "Tax and compliance for internationally mobile employees and their employers.",
    [
      "Expatriate tax filings",
      "Mobility policy design",
      "Equity and incentive plans",
      "Social security planning",
    ],
  ),
  t(
    svc("tax"),
    "international-tax-services",
    "International Tax Services",
    "Plan cross-border operations and investments with confidence.",
    [
      "Inbound and outbound structuring",
      "Treaty and permanent establishment reviews",
      "Global minimum tax readiness",
      "Repatriation planning",
    ],
  ),
  t(
    svc("tax"),
    "private-client-services",
    "Private Client Services",
    "Personal tax and wealth planning for business owners and families.",
    [
      "Personal tax returns",
      "Succession and estate planning",
      "Family office support",
      "Residency and overseas assets",
    ],
  ),
  t(
    svc("tax"),
    "tax-outsourcing-services",
    "Tax Outsourcing Services",
    "Hand over routine tax compliance to a team that gets it right on time.",
    [
      "Periodic tax filings",
      "Withholding tax compliance",
      "Tax calendar management",
      "Notice handling",
    ],
  ),
  t(
    svc("tax"),
    "transfer-pricing-services",
    "Transfer Pricing Services",
    "Defensible pricing between group companies across borders.",
    [
      "Policy design",
      "Documentation and benchmarking",
      "Advance pricing agreements",
      "Dispute resolution",
    ],
  ),
  t(
    svc("tax"),
    "customs-international-trade",
    "Customs & International Trade",
    "Move goods across borders efficiently and compliantly.",
    [
      "Tariff classification and valuation",
      "Free trade agreement benefits",
      "Customs audits",
      "Trade process reviews",
    ],
  ),
  t(
    svc("tax"),
    "indirect-taxes-other-than-gst",
    "Indirect Taxes Other Than GST",
    "Advice on the indirect taxes and levies outside the main sales tax regime.",
    [
      "Stamp duty and registration",
      "Excise and state levies",
      "Legacy indirect tax matters",
      "Litigation support",
    ],
  ),
  t(
    svc("tax"),
    "gst",
    "Goods and Services Tax (GST)",
    "Get GST right across registrations, returns, credits and disputes.",
    [
      "GST health checks",
      "Input credit optimisation",
      "Returns and reconciliations",
      "Audits and appeals",
    ],
  ),
  t(
    svc("tax"),
    "incentives-esg",
    "Incentives & ESG",
    "Identify and claim the incentives available for investment and sustainability.",
    [
      "Government incentive reviews",
      "Green investment schemes",
      "Claim preparation",
      "ESG-linked tax planning",
    ],
  ),
  // Advisory
  t(
    svc("advisory"),
    "business-restructuring",
    "Business Restructuring",
    "Fast, calm support when cash is tight or the business needs to change course.",
    [
      "Cash flow management",
      "Lender negotiations",
      "Turnaround plans",
      "Insolvency advice",
    ],
  ),
  t(
    svc("advisory"),
    "corporate-finance",
    "Corporate Finance and Investment Banking",
    "Raise capital, buy or sell with senior-led transaction support.",
    [
      "Fundraising",
      "Mergers and acquisitions",
      "Debt syndication",
      "Deal negotiation",
    ],
  ),
  t(
    svc("advisory"),
    "deal-value-creation",
    "Deal Value Creation Services",
    "Capture the value you paid for after a deal completes.",
    [
      "Integration planning",
      "Synergy tracking",
      "100-day plans",
      "Carve-out support",
    ],
  ),
  t(
    svc("advisory"),
    "executive-search",
    "Executive Search Services",
    "Find and appoint the senior leaders your business needs next.",
    [
      "Board and CXO search",
      "Leadership assessment",
      "Succession planning",
      "Onboarding support",
    ],
  ),
  t(
    svc("advisory"),
    "financial-due-diligence",
    "Financial Due Diligence",
    "Know exactly what you are buying before you sign.",
    [
      "Quality of earnings",
      "Net debt and working capital",
      "Vendor due diligence",
      "Completion mechanisms",
    ],
  ),
  t(
    svc("advisory"),
    "forensics",
    "Forensics",
    "Investigate fraud and misconduct, and recover value with evidence that stands up.",
    [
      "Fraud investigations",
      "Digital forensics",
      "Dispute and expert support",
      "Fraud risk prevention",
    ],
  ),
  t(
    svc("advisory"),
    "government-advisory",
    "Government Advisory",
    "Help public bodies plan, fund and deliver programmes that work.",
    [
      "Programme management",
      "Policy and scheme design",
      "Public-private partnerships",
      "Monitoring and evaluation",
    ],
  ),
  t(
    svc("advisory"),
    "it-risk-advisory",
    "IT Risk Advisory And Assurance",
    "Assurance over your systems, data and technology controls.",
    [
      "IT general controls reviews",
      "System and data audits",
      "Third-party assurance reports",
      "Technology risk frameworks",
    ],
  ),
  t(
    svc("advisory"),
    "ma-tax-regulatory",
    "M&A Tax and Regulatory",
    "Tax and regulatory structuring for transactions.",
    [
      "Deal structuring",
      "Tax due diligence",
      "Regulatory approvals",
      "Post-deal compliance",
    ],
  ),
  t(
    svc("advisory"),
    "management-consulting",
    "Management Consulting",
    "Practical strategy and operational improvement that delivers results.",
    [
      "Growth strategy",
      "Operating model design",
      "Cost and margin improvement",
      "Performance management",
    ],
  ),
  t(
    svc("advisory"),
    "research-insights",
    "Research & Insights",
    "Market, sector and customer research to support better decisions.",
    [
      "Market sizing and entry studies",
      "Sector research",
      "Customer and competitor analysis",
      "Survey design",
    ],
  ),
  t(
    svc("advisory"),
    "risk-advisory-services",
    "Risk Advisory Services",
    "Understand, manage and report your risks with confidence.",
    [
      "Enterprise risk management",
      "Internal audit",
      "Internal financial controls",
      "Governance reviews",
    ],
  ),
  t(
    svc("advisory"),
    "deals-strategy",
    "Deals Strategy",
    "Shape the right deal before you commit.",
    [
      "Acquisition strategy",
      "Target screening",
      "Commercial due diligence",
      "Exit planning",
    ],
  ),
  t(
    svc("advisory"),
    "sustainability-esg",
    "Sustainability & ESG",
    "Turn sustainability commitments into credible, measurable progress.",
    [
      "ESG strategy and targets",
      "Sustainability reporting",
      "Carbon footprinting",
      "ESG due diligence",
    ],
  ),
  t(
    svc("advisory"),
    "valuations",
    "Valuations",
    "Independent valuations for transactions, tax, disputes and reporting.",
    [
      "Business and share valuations",
      "Purchase price allocation",
      "Impairment testing",
      "Intangible asset valuation",
    ],
  ),
  // Managed Services
  t(
    svc("managed-services"),
    "corporate-secretarial",
    "Corporate Secretarial Services and Compliance Management",
    "Keep your company records, filings and governance compliant.",
    [
      "Statutory filings",
      "Board and shareholder meetings",
      "Statutory registers",
      "Compliance calendars",
    ],
  ),
  t(
    svc("managed-services"),
    "finance-accounting-outsourcing",
    "Finance and Accounting Outsourcing",
    "Accurate books and timely reporting, handled for you.",
    [
      "Bookkeeping and closing",
      "Management reporting",
      "Accounts payable and receivable",
      "Year-end support",
    ],
  ),
  t(
    svc("managed-services"),
    "managed-services-international",
    "Managed Services – International",
    "One partner for finance, payroll and compliance across countries.",
    [
      "Multi-country accounting",
      "Global payroll coordination",
      "Local statutory compliance",
      "Consolidated reporting",
    ],
  ),
  t(
    svc("managed-services"),
    "hr-outsourcing",
    "Human Resource Outsourcing",
    "HR administration and policy support for growing teams.",
    [
      "HR policies and handbooks",
      "Onboarding and exits",
      "HR systems",
      "Employee records",
    ],
  ),
  t(
    svc("managed-services"),
    "payroll-compliance",
    "Payroll and Compliance Management",
    "Pay your people correctly and on time, every time.",
    [
      "Payroll processing",
      "Statutory deductions and filings",
      "Benefits administration",
      "Employee self-service",
    ],
  ),
  t(
    svc("managed-services"),
    "shared-service-centre",
    "Shared Service Centre Services",
    "Design, set up and run shared service centres that scale.",
    [
      "Feasibility and design",
      "Set-up and transition",
      "Process standardisation",
      "Ongoing operations support",
    ],
  ),
  t(
    svc("managed-services"),
    "tax-compliance-support",
    "Tax Compliance Support",
    "Reliable, on-time tax compliance as part of your outsourced finance function.",
    [
      "Periodic tax returns",
      "Withholding and indirect tax filings",
      "Reconciliations",
      "Notice management",
    ],
  ),
  // Digital
  t(
    svc("digital"),
    "digital-services",
    "Digital Services",
    "Technology strategy, implementation and cyber security support.",
    [
      "Technology strategy",
      "ERP and cloud implementation",
      "Data analytics and AI",
      "Cyber security",
    ],
  ),
  t(
    svc("digital"),
    "technology-products",
    "Technology Products and Solutions",
    "Ready-made tools that automate routine finance and compliance work.",
    [
      "Compliance automation tools",
      "Reconciliation solutions",
      "Dashboards and reporting",
      "Implementation and support",
    ],
  ),
  // International Desk
  t(
    svc("international-desk"),
    "canada-desk",
    `${BRAND} - Canada Desk`,
    "A single point of contact for businesses moving between Canada and here.",
    [
      "Market entry",
      "Cross-border tax",
      "Entity set-up and compliance",
      "Investment advice",
    ],
  ),
  t(
    svc("international-desk"),
    "spain-desk",
    `${BRAND} - Spain Desk`,
    "Support for Spanish businesses investing here, and local businesses expanding to Spain.",
    [
      "Market entry",
      "Cross-border tax",
      "Entity set-up and compliance",
      "Investment advice",
    ],
  ),
  t(
    svc("international-desk"),
    "uk-desk",
    `${BRAND} - UK Desk`,
    "Helping UK businesses invest here, and local businesses expand into the UK.",
    [
      "Market entry",
      "Cross-border tax",
      "Entity set-up and compliance",
      "Investment advice",
    ],
  ),
  t(
    svc("international-desk"),
    "usa-desk",
    `${BRAND} - USA Desk`,
    "A dedicated desk for businesses moving between the USA and here.",
    [
      "Market entry",
      "Cross-border tax",
      "Entity set-up and compliance",
      "Investment advice",
    ],
  ),
  // Industry sub-sectors
  t(
    ind("financial-services"),
    "banking",
    "Banking",
    "Audit, regulatory and advisory support for banks and lenders.",
    [
      "Regulatory reporting",
      "Credit risk models",
      "Capital and liquidity reviews",
      "Fintech partnerships",
    ],
  ),
  t(
    ind("financial-services"),
    "insurance",
    "Insurance",
    "Support for insurers, brokers and MGAs through regulatory and market change.",
    [
      "IFRS 17 reporting",
      "Solvency reviews",
      "Claims process improvement",
      "Broker transactions",
    ],
  ),
  t(
    ind("financial-services"),
    "asset-management",
    "Asset & Wealth Management",
    "Fund audits, regulatory compliance and growth support for managers.",
    [
      "Fund audits",
      "Client asset reviews",
      "Operational due diligence",
      "Platform transactions",
    ],
  ),
  t(
    ind("public-sector"),
    "local-government",
    "Local Government",
    "Audit and advisory for councils delivering more with less.",
    [
      "External audit",
      "Value for money reviews",
      "Commercial strategy",
      "Shared services",
    ],
  ),
  t(
    ind("public-sector"),
    "education",
    "Education",
    "Support for schools, academy trusts, colleges and universities.",
    [
      "Academy trust audits",
      "Funding compliance",
      "Estate strategy",
      "Governance reviews",
    ],
  ),
  t(
    ind("public-sector"),
    "charities",
    "Charities & Not-for-profit",
    "Help charities stay compliant and make every pound count.",
    [
      "Charity audits and examinations",
      "Gift Aid and VAT",
      "Governance reviews",
      "Impact reporting",
    ],
  ),
  t(
    ind("energy"),
    "renewables",
    "Renewables",
    "Funding, tax and reporting support for renewable developers and investors.",
    [
      "Project finance models",
      "Capital allowances",
      "Transaction support",
      "Sustainability reporting",
    ],
  ),
  t(
    ind("energy"),
    "utilities",
    "Utilities",
    "Regulatory and operational support for water, gas and power companies.",
    [
      "Regulatory accounts",
      "Price control support",
      "Asset management reviews",
      "Customer billing assurance",
    ],
  ),
  // About
  t(
    about,
    "leadership-team",
    "Leadership Team",
    "The partners who lead the firm and set our strategy.",
    [
      "Helen Carter, Managing Partner",
      "Ravi Patel, Head of Deal Advisory",
      "Sarah Mitchell, Head of Audit",
      "James Okafor, Head of Tax",
    ],
  ),
  t(
    about,
    "partner-board",
    "Partner Board",
    "Elected partners who oversee strategy, risk and the firm’s long-term health.",
    [
      "Seven elected partners",
      "Independent non-executive chair",
      "Quarterly strategy and risk reviews",
      "Annual partner vote",
    ],
  ),
  t(
    about,
    "committees",
    "Committees",
    "Specialist committees that keep our work independent and high quality.",
    [
      "Audit Quality Committee",
      "Risk Committee",
      "People & Inclusion Committee",
      "Remuneration Committee",
    ],
  ),
  t(
    about,
    "vision",
    "Our Vision",
    "To be the first call for every ambitious business in the regions we serve.",
    [
      "Advice that is clear and practical",
      "Long-term relationships, not transactions",
      "Investing in people and technology",
      "Growing responsibly",
    ],
  ),
  t(
    about,
    "responsible-ai",
    "Responsible AI",
    "How we use AI to serve clients better while keeping their data safe.",
    [
      "Clear rules on approved AI tools",
      "Client data never used to train public models",
      "Human review of all AI-assisted work",
      "Regular audits of our AI use",
    ],
  ),
  t(
    about,
    "supplier",
    "Become a Supplier",
    "We work with suppliers who share our standards on quality, ethics and sustainability.",
    [
      "Fair payment terms",
      "Supplier code of conduct",
      "Sustainability expectations",
      "Contact our procurement team via Contact us",
    ],
  ),
  // Pages linked from the website-style menu (original sample copy)
  t(
    svc("assurance"),
    "accounting-advisory",
    "Accounting Advisory Services",
    "Reliable, well-documented financial reporting you can stand behind.",
    [
      "GAAP Conversion and Adoption of New Standards",
      "Centre of Excellence",
      "IPO and Transaction Services",
      "Complex Accounting Advisory",
      "Audit Readiness",
      "Technology Solutions",
      "Actuarial Services",
    ],
  ),
  t(
    svc("assurance"),
    "audit-attestation",
    "Financial Statement Audit and Attestation Services",
    "Independent audits and attestation reports that give stakeholders confidence in your numbers.",
    [
      "Statutory and group audits",
      "Limited reviews and agreed-upon procedures",
      "Certifications for lenders and regulators",
      "Audit committee reporting",
    ],
  ),
  t(
    about,
    "history",
    `${BRAND} History`,
    "How a two-partner practice grew into a national advisory firm over four decades.",
    [
      "Founded by two partners in a single office",
      "Expanded into tax and advisory services",
      "Opened offices across the country",
      "Today: thousands of people serving clients nationwide",
    ],
  ),
  t(
    about,
    "awards",
    "Awards & Accolades",
    "Recognition for the quality of our work and the experience of our people.",
    [
      "Ranked a top mid-market deal adviser",
      "Named a top employer for trainees",
      "Shortlisted for audit quality awards",
      "Recognised for community impact",
    ],
  ),
  t(
    about,
    "edge",
    `${BRAND} EDGE`,
    "Our programme for building the skills and leadership of tomorrow’s advisers.",
    [
      "Structured learning for every career stage",
      "Mentoring from senior partners",
      "Secondments across offices and services",
      "Leadership development for future partners",
    ],
  ),
];

export const topicById = (id: string) => topics.find((x) => x.id === id);

// ---------------------------------------------------------------------------
// Menu tree
// ---------------------------------------------------------------------------

export type NavNode = {
  id: string;
  title: string;
  href?: Href;
  /** Opens outside the app (e.g. a separate microsite). */
  external?: string;
  children?: NavNode[];
};

/** Insights sections shown in the Insights menu; each opens /insights-section/[id]. */
export const insightSections: {
  id: string;
  title: string;
  intro: string;
  categories: string[];
  reportsOnly?: boolean;
}[] = [
  {
    id: "alerts",
    title: "Alerts",
    intro:
      "Short, timely updates on tax, regulatory and reporting changes and what they mean for you.",
    categories: ["Tax", "Audit"],
  },
  {
    id: "blogs",
    title: "Blogs",
    intro:
      "Opinion and practical tips from our people on the issues facing growing businesses.",
    categories: ["Growth", "Digital"],
  },
  {
    id: "flyers-brochures",
    title: "Flyers | Brochures",
    intro: "Quick guides to our services and specialist teams.",
    categories: ["Deals", "Risk"],
  },
  {
    id: "global-thought-leadership",
    title: "Global Thought Leadership",
    intro:
      "Research and perspectives on the trends reshaping business worldwide.",
    categories: [],
    reportsOnly: true,
  },
  {
    id: "newsletters",
    title: "Newsletters | Periodicals | Journals",
    intro:
      "Regular round-ups of the most important developments in tax, audit and business.",
    categories: ["Tax", "Audit", "Deals"],
  },
  {
    id: "publications",
    title: "Publications",
    intro: "In-depth reports and guides from our specialists.",
    categories: [],
    reportsOnly: true,
  },
  {
    id: "surveys",
    title: "Surveys",
    intro:
      "What business leaders tell us about their plans, priorities and concerns.",
    categories: ["Sustainability", "Risk"],
  },
  {
    id: "ind-as-118",
    title: "Ind AS 118 Resources",
    intro:
      "Guidance and tools to prepare for the new presentation and disclosure standard.",
    categories: ["Audit"],
  },
];

/** Mirrors the client website's header: Services (two levels + featured), Insights and About (one level each). */
export const mainNav: NavNode[] = [
  {
    id: "services",
    title: "Services",
    href: "/services",
    // Each service lists its sub-pages in the same order as the client website's menu.
    children: services.map((s) => ({
      id: s.id,
      title: s.title,
      href: `/service/${s.id}` as Href,
      children: topics
        .filter((x) => x.parent.kind === "service" && x.parent.id === s.id)
        .map((x) => ({
          id: x.id,
          title: x.title,
          href: `/topic/${x.id}` as Href,
        })),
    })),
  },
  {
    id: "insights",
    title: "Insights",
    href: "/insights",
    children: [
      ...insightSections
        .slice(0, 7)
        .map((x) => ({
          id: x.id,
          title: x.title,
          href: `/insights-section/${x.id}` as Href,
        })),
      {
        id: "indian-tiffin",
        title: "The Indian Tiffin",
        external: "https://tiffin.bdo.in",
      },
      {
        id: "ind-as-118",
        title: "Ind AS 118 Resources",
        href: "/insights-section/ind-as-118" as Href,
      },
    ],
  },
  {
    id: "about",
    title: "About",
    href: "/about",
    children: [
      { id: "history", title: `${BRAND} History`, href: "/topic/history" },
      { id: "awards", title: "Awards & Accolades", href: "/topic/awards" },
      { id: "edge", title: `${BRAND} EDGE`, href: "/topic/edge" },
    ],
  },
];

/** "Featured" column in the Services mega-menu. */
export const featuredLinks: { id: string; title: string; href: Href }[] = [
  {
    id: "sustainability-survey-2026",
    title: "Sustainability Survey 2026",
    href: "/insight/sustainability-survey-2026",
  },
  {
    id: "digital-edge-4",
    title: "The digital edge, part 4",
    href: "/insight/digital-edge-4",
  },
  {
    id: "risk-landscape-2026",
    title: "The 2026 risk landscape",
    href: "/insight/risk-landscape-2026",
  },
];

export const utilityNav: { title: string; href: Href }[] = [
  { title: "Locations", href: "/offices" },
  { title: "Our People", href: "/advisers" },
  { title: "Events", href: "/events" },
  { title: "News", href: "/news" },
  { title: "Careers", href: "/careers" },
];
