/**
 * SEO Data & Master Configuration
 * Central source of truth for metadata, canonicals, keywords, schemas, and content.
 */

export const SITE_CONFIG = {
  name: 'InstaScrape Pro',
  legalName: 'InstaScrape Pro Intelligence Platform',
  siteUrl: 'https://instascrape-pro.onrender.com',
  defaultTitle: 'InstaScrape Pro | Instagram Profile Analyzer & Public Content Research',
  defaultDescription:
    'Production-grade Instagram profile analyzer, public post viewer, and bio audit tool. Extract post metrics, audit profile presentation, and export data without logging in.',
  keywords: [
    'Instagram profile analyzer',
    'Instagram bio analyzer',
    'Instagram profile audit tool',
    'Instagram username search tool',
    'Instagram public post viewer',
    'Free Instagram profile analysis tool',
    'Instagram content research tool',
    'Instagram post scraper'
  ],
  supportEmail: 'support@instascrapepro.com',
  themeColor: '#090b0e',
  locale: 'en_US',
  social: {
    twitter: '@instascrapepro'
  }
};

export const SEO_PAGES = {
  // 1. Home / Public Post Viewer & Scraper
  home: {
    path: '/',
    title: 'InstaScrape Pro | Instagram Public Post Viewer & Content Research',
    description:
      'Search public Instagram profiles, view posts, calculate engagement metrics, and export data in CSV/JSON without logging into Instagram.',
    canonical: `${SITE_CONFIG.siteUrl}/`,
    primaryKeyword: 'Instagram public post viewer',
    supportingKeywords: [
      'Instagram username search tool',
      'Instagram content research tool',
      'public Instagram post viewer',
      'Instagram post metrics'
    ],
    breadcrumb: [{ name: 'Home', url: `${SITE_CONFIG.siteUrl}/` }]
  },

  // 2. Profile Analyzer Landing Page
  profileAnalyzer: {
    path: '/instagram-profile-analyzer',
    tab: 'analyzer',
    title: 'Instagram Profile Analyzer & AI Performance Score | InstaScrape Pro',
    description:
      'Analyze any public Instagram profile presentation, bio clarity, follower-to-following ratio, and engagement benchmark with objective AI-powered scoring.',
    canonical: `${SITE_CONFIG.siteUrl}/instagram-profile-analyzer`,
    primaryKeyword: 'Instagram profile analyzer',
    supportingKeywords: [
      'free Instagram profile analysis tool',
      'analyze Instagram profile',
      'Instagram profile audit',
      'Instagram profile metrics',
      'Instagram profile presentation'
    ],
    headline: 'Instagram Profile Analyzer',
    subheadline:
      'Evaluate your public Instagram profile presentation with AI-driven scoring, clarity benchmarks, and actionable improvement recommendations.',
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Profile Analyzer', url: `${SITE_CONFIG.siteUrl}/instagram-profile-analyzer` }
    ]
  },

  // 3. Bio Analyzer Landing Page
  bioAnalyzer: {
    path: '/instagram-bio-analyzer',
    tab: 'analyzer',
    title: 'Instagram Bio Analyzer & Bio Optimizer | InstaScrape Pro',
    description:
      'Review your Instagram bio clarity, value proposition, link placement, and call to action. Get actionable AI suggestions and high-converting bio rewrites.',
    canonical: `${SITE_CONFIG.siteUrl}/instagram-bio-analyzer`,
    primaryKeyword: 'Instagram bio analyzer',
    supportingKeywords: [
      'Instagram bio review tool',
      'optimize Instagram bio',
      'Instagram bio clarity score',
      'Instagram bio rewrite',
      'Instagram bio tips'
    ],
    headline: 'Instagram Bio Analyzer & Optimizer',
    subheadline:
      'Turn casual profile visitors into followers and customers with an objective, data-backed analysis of your 150-character Instagram bio.',
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Bio Analyzer', url: `${SITE_CONFIG.siteUrl}/instagram-bio-analyzer` }
    ]
  },

  // 4. Profile Audit Landing Page
  profileAudit: {
    path: '/instagram-profile-audit',
    tab: 'analyzer',
    title: 'Instagram Profile Audit Tool | Free Health Check | InstaScrape Pro',
    description:
      'Perform an objective audit of your Instagram profile. Review profile presentation, follower-following ratio, bio structure, and audience readiness.',
    canonical: `${SITE_CONFIG.siteUrl}/instagram-profile-audit`,
    primaryKeyword: 'Instagram profile audit tool',
    supportingKeywords: [
      'Instagram profile audit checklist',
      'audit public Instagram account',
      'Instagram brand audit',
      'Instagram account health check',
      'free Instagram audit'
    ],
    headline: 'Instagram Profile Audit Tool',
    subheadline:
      'A structured health check for your Instagram brand presence. Discover blind spots, improve conversion friction, and benchmark against best practices.',
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Profile Audit', url: `${SITE_CONFIG.siteUrl}/instagram-profile-audit` }
    ]
  },

  // 5. Content Research Landing Page
  contentResearch: {
    path: '/instagram-content-research',
    tab: 'scraper',
    title: 'Instagram Content Research Tool & Post Analyzer | InstaScrape Pro',
    description:
      'Research top-performing public Instagram content, analyze engagement rates, study captions, and benchmark competitors without algorithmic bias.',
    canonical: `${SITE_CONFIG.siteUrl}/instagram-content-research`,
    primaryKeyword: 'Instagram content research tool',
    supportingKeywords: [
      'public Instagram post research',
      'Instagram competitor post analysis',
      'analyze Instagram captions',
      'Instagram content benchmark',
      'Instagram post extractor'
    ],
    headline: 'Instagram Content Research Tool',
    subheadline:
      'Extract, inspect, and benchmark public Instagram posts across multiple accounts simultaneously. Identify top engagement formats and high-performing captions.',
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Content Research', url: `${SITE_CONFIG.siteUrl}/instagram-content-research` }
    ]
  },

  // Resources Index
  resources: {
    path: '/resources',
    title: 'Instagram Profile Research & Strategy Guides | InstaScrape Pro',
    description:
      'Expert guides on Instagram bio optimization, profile audits, engagement rate calculations, and public content research. Written for creators and brands.',
    canonical: `${SITE_CONFIG.siteUrl}/resources`,
    primaryKeyword: 'Instagram profile research guides',
    supportingKeywords: [
      'Instagram bio tips',
      'Instagram audit checklist',
      'Instagram engagement calculation',
      'professional Instagram guide'
    ],
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Resources', url: `${SITE_CONFIG.siteUrl}/resources` }
    ]
  },

  // Contact Page
  contact: {
    path: '/contact',
    title: 'Contact Support & Inquiries | InstaScrape Pro',
    description:
      'Get in touch with the InstaScrape Pro team for platform support, technical questions, billing inquiries, or API assistance.',
    canonical: `${SITE_CONFIG.siteUrl}/contact`,
    primaryKeyword: 'InstaScrape Pro contact support',
    supportingKeywords: ['InstaScrape Pro support', 'Instagram scraper help', 'contact developer'],
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Contact', url: `${SITE_CONFIG.siteUrl}/contact` }
    ]
  },

  // Legal Pages
  terms: {
    path: '/terms',
    title: 'Terms of Service | InstaScrape Pro',
    description:
      'Read the InstaScrape Pro terms of service, acceptable use policies, public data compliance requirements, and subscription terms.',
    canonical: `${SITE_CONFIG.siteUrl}/terms`,
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Terms of Service', url: `${SITE_CONFIG.siteUrl}/terms` }
    ]
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy Policy | InstaScrape Pro',
    description:
      'Learn how InstaScrape Pro protects your personal information, handles public data queries, and complies with data privacy regulations.',
    canonical: `${SITE_CONFIG.siteUrl}/privacy`,
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Privacy Policy', url: `${SITE_CONFIG.siteUrl}/privacy` }
    ]
  },

  // Account Page (Robots: noindex)
  account: {
    path: '/account',
    title: 'My Account & Subscriptions | InstaScrape Pro',
    description: 'Manage your InstaScrape Pro account settings, subscription tier, and search quota.',
    canonical: `${SITE_CONFIG.siteUrl}/account`,
    noindex: true
  }
};

/**
 * 5 Original High-Quality Resource Articles
 */
export const ARTICLES = [
  {
    slug: 'how-to-improve-instagram-bio',
    path: '/resources/how-to-improve-instagram-bio',
    title: 'How to Improve Your Instagram Bio: 7-Step Optimization Guide',
    shortTitle: 'How to Improve Your Instagram Bio',
    description:
      'Learn how to write a clear, high-converting Instagram bio. Discover the 5 essential elements: niche positioning, social proof, and effective calls to action.',
    primaryKeyword: 'how to improve your Instagram bio',
    supportingKeywords: [
      'Instagram bio tips',
      'high-converting Instagram bio examples',
      'how to write a good Instagram bio',
      'Instagram bio optimization'
    ],
    author: 'InstaScrape Pro Research Team',
    publishedDate: '2026-03-15',
    modifiedDate: '2026-10-12',
    readingTime: '6 min read',
    category: 'Bio Optimization',
    relatedTool: '/instagram-bio-analyzer',
    relatedToolLabel: 'Analyze Your Bio with AI',
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Resources', url: `${SITE_CONFIG.siteUrl}/resources` },
      { name: 'How to Improve Your Instagram Bio', url: `${SITE_CONFIG.siteUrl}/resources/how-to-improve-instagram-bio` }
    ],
    sections: [
      {
        heading: 'The 3-Second Rule: Why Your Instagram Bio Matters',
        content: `When a new visitor lands on your Instagram profile, you have approximately three seconds before they decide whether to follow, tap your bio link, or bounce. In those three seconds, the visitor is evaluating three fundamental questions:

1. **Who are you?** (Identity and credibility)
2. **What value do you provide to me?** (Niche and utility)
3. **What should I do next?** (Call to action)

Most Instagram bios fail not because the creator or brand lacks quality content, but because the bio is vague, cluttered with irrelevant emojis, or missing a direct next step. Optimizing your 150 characters is the highest-leverage improvement you can make to your profile conversion rate.`
      },
      {
        heading: 'The 5 Core Elements of a High-Converting Bio',
        content: `Every effective public Instagram bio contains five distinct structural components:

- **1. The Niche Clarifier:** Explicitly name who you serve and what problem you solve. Avoid broad claims like "Inspiring the world"; use precise positioning like "Helping B2B SaaS teams scale organic video."
- **2. The Unique Value Proposition (UVP):** What makes your perspective or product distinct? Mention your framework, proprietary method, or core offering.
- **3. Social Proof or Credibility Anchor:** A concrete metric or badge that reduces skepticism. Examples include "Author of 2 books", "Trusted by 10k+ founders", or "Featured in Forbes".
- **4. A Single Primary Call to Action (CTA):** Pointing visitors to do *one* thing. Never ask someone to subscribe to YouTube, check out a podcast, and buy a course in the same bio.
- **5. An Optimized Destination Link:** Use descriptive link text rather than a bare URL so users know what to expect.`
      },
      {
        heading: 'Common Bio Mistakes to Eliminate Immediately',
        content: `Before rewriting your bio, review your current text for these frequent conversion killers:

- **Inside jokes and abstract quotes:** Visitors who don't know you yet will not understand cryptic quotes.
- **Excessive emoji walls:** More than 3-4 emojis makes a bio difficult for screen readers and slows down visual scanning.
- **Missing link context:** Simply pointing a downward finger emoji to a Linktree without explaining why anyone should click.
- **Ignoring line breaks:** A block of unformatted text is difficult to read on mobile screens. Use clean line breaks to separate ideas.`
      },
      {
        heading: '4 Real Bio Formulas Across Different Niches',
        content: `Here are battle-tested bio formulas tailored for specific account categories:

### For Creators & Educators
\`\`\`
[Category / Focus Area]
Helping [Target Audience] achieve [Specific Outcome]
[Credibility metric or free resource name]
👇 Get the free weekly breakdown:
[link]
\`\`\`

### For Agency & B2B Service Providers
\`\`\`
[Service Category] for [Ideal Client Profile]
Case studies: [Key Result or Metric]
Turnaround: [Timeline or Delivery Guarantee]
📩 Inquire about project availability:
[link]
\`\`\`

### For E-Commerce & Product Brands
\`\`\`
[Product Category] engineered for [Primary Benefit]
Sustainable, plastic-free & guaranteed for life.
Free shipping worldwide on orders $50+
Shop the new collection:
[link]
\`\`\`

### For Local Businesses & Consultants
\`\`\`
[Specialty / Trade] in [City/Region]
Over [Number] satisfied clients since [Year]
Appointments & consultations:
[link / phone]
\`\`\``
      },
      {
        heading: 'How to Test and Iterate Your Bio',
        content: `Bio optimization is an ongoing process. Use InstaScrape Pro's Profile Analyzer to check your clarity score, review AI-suggested rewrites, and track how changes to your link and CTA impact your visitor conversion over time.`
      }
    ]
  },

  {
    slug: 'instagram-profile-audit-checklist',
    path: '/resources/instagram-profile-audit-checklist',
    title: 'Instagram Profile Audit Checklist: Complete 15-Point Review',
    shortTitle: 'Instagram Profile Audit Checklist',
    description:
      'Step-by-step 15-point checklist to audit your Instagram profile presentation, bio clarity, profile photo, link hierarchy, and public post engagement.',
    primaryKeyword: 'Instagram profile audit checklist',
    supportingKeywords: [
      'how to audit an Instagram account',
      'Instagram brand audit checklist',
      'profile optimization checklist',
      'Instagram health check'
    ],
    author: 'InstaScrape Pro Research Team',
    publishedDate: '2026-03-20',
    modifiedDate: '2026-10-12',
    readingTime: '7 min read',
    category: 'Profile Audits',
    relatedTool: '/instagram-profile-audit',
    relatedToolLabel: 'Run an Automated Profile Audit',
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Resources', url: `${SITE_CONFIG.siteUrl}/resources` },
      { name: 'Instagram Profile Audit Checklist', url: `${SITE_CONFIG.siteUrl}/resources/instagram-profile-audit-checklist` }
    ],
    sections: [
      {
        heading: 'Why You Need a Periodic Profile Audit',
        content: `Social media strategies evolve quickly, but brand profiles often sit unchanged for months or years. An Instagram profile audit is a systematic evaluation of your account's public-facing assets to ensure they align with current brand goals and maximize visitor engagement.

Conducting an audit every 90 days prevents brand drift, uncovers broken links, and reveals shifts in audience interaction patterns.`
      },
      {
        heading: 'Phase 1: Identity and Profile Header (Points 1–4)',
        content: `The top fold of your profile is the primary anchor of credibility:

1. **Username Consistency:** Is your Instagram handle recognizable, free of confusing numbers or excess underscores, and consistent with your other digital touchpoints?
2. **Display Name Keyword Optimization:** Your display name (the bold text above your bio) is indexed in Instagram search. Does it include your primary niche keyword (e.g., "Sarah Miller | Brand Strategy")?
3. **Profile Picture Contrast & Legibility:** Does your avatar stand out on both dark and light mobile backgrounds? Faces should be cropped closely (shoulders-up); brand logos should have ample padding so they aren't clipped by the circular mask.
4. **Account Category Tag:** Is your public category tag (e.g., "Entrepreneur", "Product/Service", "Software Company") accurate and relevant to your niche?`
      },
      {
        heading: 'Phase 2: Bio Architecture & Conversion (Points 5–8)',
        content: `Audit the conversion pathway in your 150-character bio:

5. **Clarity of Target Audience:** Can a first-time visitor immediately identify whether this account is relevant to them?
6. **Credibility Signal:** Does the bio provide at least one objective reason to trust the creator or brand?
7. **Single Purpose Call-to-Action:** Is there a clear directive indicating why a visitor should click the link?
8. **Link Health and Destination:** Is the bio link working? Does the landing page load in under 2 seconds on mobile with zero redirect errors?`
      },
      {
        heading: 'Phase 3: Story Highlights & Visual Organization (Points 9–11)',
        content: `Story Highlights act as the navigation menu of an Instagram profile:

9. **Relevant Highlight Categories:** Do your highlights answer core visitor questions (About, Case Studies/Reviews, FAQs, Services, Start Here)?
10. **Updated Content:** Are the stories in your highlights recent, or are they promoting expired discounts from three years ago?
11. **Consistent Highlight Covers:** Do highlight covers share a clean, cohesive visual language matching your brand palette?`
      },
      {
        heading: 'Phase 4: Content Consistency & Engagement (Points 12–15)',
        content: `Evaluate your public content footprint:

12. **Pinned Posts Strategy:** Are the top three pinned posts chosen strategically (e.g., your story/origin, your flagship offering, and your best-performing educational piece)?
13. **Follower-to-Following Ratio:** A balanced or healthy ratio indicates authority; following thousands of random accounts can look spammy to prospective clients.
14. **Caption Value & Formatting:** Are captions structured with paragraphs and hooks, or are they unformatted walls of text?
15. **Public Engagement Health:** Calculate your public engagement rate (Likes + Comments / Followers) on recent posts to benchmark audience interaction.`
      }
    ]
  },

  {
    slug: 'make-instagram-profile-professional',
    path: '/resources/make-instagram-profile-professional',
    title: 'How to Make Your Instagram Profile More Professional in 2026',
    shortTitle: 'Make Your Instagram Profile Professional',
    description:
      'Transform your personal or brand profile into a polished, credible presence that converts profile visitors into followers, clients, and customers.',
    primaryKeyword: 'how to make your Instagram profile more professional',
    supportingKeywords: [
      'professional Instagram tips',
      'business Instagram profile setup',
      'optimizing Instagram for clients',
      'Instagram credibility'
    ],
    author: 'InstaScrape Pro Research Team',
    publishedDate: '2026-04-02',
    modifiedDate: '2026-10-12',
    readingTime: '6 min read',
    category: 'Brand Strategy',
    relatedTool: '/instagram-profile-analyzer',
    relatedToolLabel: 'Check Your Profile Professionalism Score',
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Resources', url: `${SITE_CONFIG.siteUrl}/resources` },
      { name: 'Make Your Profile Professional', url: `${SITE_CONFIG.siteUrl}/resources/make-instagram-profile-professional` }
    ],
    sections: [
      {
        heading: 'What Makes an Instagram Profile Look Professional?',
        content: `Professionalism on Instagram is not about sounding corporate, robotic, or dull. Rather, it is about intentionality and clarity. A professional profile communicates that you respect the visitor's time, understand your discipline, and have a legitimate operation.

Whether you are a freelance designer, founder, consultant, or growing e-commerce brand, modern customers conduct due diligence on Instagram before deciding to work with you.`
      },
      {
        heading: 'Step 1: Clean Up Your Profile Imagery',
        content: `Your profile image is displayed at roughly 40x40 pixels in comments and direct messages, and 150x150 on your main profile.

- **High-contrast lighting:** Avoid dark selfies, low-light nightclub photos, or grainy crops.
- **Uncluttered backgrounds:** Use a neutral or brand-colored background that keeps the focus on your face or brand emblem.
- **High-resolution assets:** Upload 320x320 PNG or JPG files to ensure crisp rendering on high-DPI displays.`
      },
      {
        heading: 'Step 2: Streamline Contact Methods and Action Buttons',
        content: `Do not force high-intent clients to DM you for basic information:

- Connect a dedicated business email address (e.g., \`hello@yourdomain.com\`) rather than a personal Gmail.
- Enable Instagram's native contact buttons (Email, Call, or Book) if you operate a service or local business.
- Provide a direct link to your portfolio or case studies directly in the bio link slot.`
      },
      {
        heading: 'Step 3: Curate Your First 9 Grid Tiles',
        content: `When someone visits your profile, the top 9 grid tiles dictate 80% of their perception:

- **Pin your 3 best assets:** Use pinned posts to tell your story, highlight your biggest client testimonial or case study, and showcase your best-performing framework.
- **Use consistent cover frames:** For Reels and video content, select clean, legible title cards so the grid looks organized rather than chaotic.
- **Archive obsolete content:** Remove low-quality, outdated personal posts or memes that conflict with your professional positioning.`
      },
      {
        heading: 'Step 4: Maintain Consistent Voice Across Captions',
        content: `A professional profile writes captions that deliver genuine insights:

- Avoid vague one-word captions on business posts.
- Use clear paragraph breaks for mobile readability.
- State sources when sharing statistics or case study metrics.`
      }
    ]
  },

  {
    slug: 'understanding-public-instagram-engagement',
    path: '/resources/understanding-public-instagram-engagement',
    title: 'Understanding Public Instagram Engagement: Real Benchmarks & Metrics',
    shortTitle: 'Understanding Public Instagram Engagement',
    description:
      'Demystify engagement rates on public Instagram profiles. Learn how to calculate true engagement, spot vanity metrics, and benchmark performance.',
    primaryKeyword: 'understanding public Instagram engagement',
    supportingKeywords: [
      'how to calculate Instagram engagement rate',
      'public Instagram metrics benchmark',
      'likes to comments ratio',
      'Instagram engagement formula'
    ],
    author: 'InstaScrape Pro Research Team',
    publishedDate: '2026-04-18',
    modifiedDate: '2026-10-12',
    readingTime: '7 min read',
    category: 'Analytics & Research',
    relatedTool: '/instagram-content-research',
    relatedToolLabel: 'Inspect Public Post Engagement',
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Resources', url: `${SITE_CONFIG.siteUrl}/resources` },
      { name: 'Understanding Public Instagram Engagement', url: `${SITE_CONFIG.siteUrl}/resources/understanding-public-instagram-engagement` }
    ],
    sections: [
      {
        heading: 'Why Public Engagement Matters More Than Follower Count',
        content: `Follower count is a vanity metric that is easily distorted by old accounts, follow-for-follow loops, or inactive profiles. Public engagement—specifically the volume of likes and comments generated on public posts relative to audience size—is the truest public indicator of whether an account commands genuine attention.

Whether evaluating your own performance or vetting an influencer for a partnership, understanding public engagement benchmarks protects you from misleading vanity metrics.`
      },
      {
        heading: 'The Standard Public Engagement Rate Formula',
        content: `Because private metrics like Saves, Shares, and Reach are not publicly visible, standard public engagement rate (ERR) is calculated across recent posts:

\`\`\`
Engagement Rate (%) = ((Average Likes per Post + Average Comments per Post) / Total Followers) * 100
\`\`\`

**Example:**
- Followers: 20,000
- Average Likes on last 12 posts: 450
- Average Comments on last 12 posts: 30
- Total Interactions = 480
- Engagement Rate = (480 / 20,000) * 100 = **2.4%**`
      },
      {
        heading: 'Realistic Engagement Benchmarks by Account Size',
        content: `As an account grows in followers, the average public engagement percentage naturally drops due to algorithmic distribution:

| Account Tier | Follower Range | Typical Public Engagement Rate |
| :--- | :--- | :--- |
| **Nano** | 1,000 – 10,000 | 3.5% – 7.0%+ |
| **Micro** | 10,000 – 50,000 | 2.0% – 3.5% |
| **Mid-Tier** | 50,000 – 500,000 | 1.2% – 2.2% |
| **Macro** | 500,000 – 1,000,000 | 1.0% – 1.8% |
| **Mega / Celebrity** | 1,000,000+ | 0.8% – 1.5% |

An account with 100,000 followers and a 2.0% engagement rate is performing exceptionally well, whereas an account with 2,000 followers at 1.0% indicates low audience resonance.`
      },
      {
        heading: 'Red Flags and Suspicious Engagement Patterns',
        content: `When analyzing public profiles, watch out for these telltale signs of synthetic engagement:

- **The 100:1 Likes-to-Comments Disparity:** An account with 3,000 likes but only 2 comments often indicates automated like packages. A natural ratio is roughly 20 to 50 likes per comment.
- **Repetitive Bot Comments:** Generic comments like "Nice picture!", "Dm me", or fire emojis left within seconds of posting.
- **Sudden Engagement Drops:** An account that receives 2,000 likes on sponsored posts but only 50 on standard photos.`
      },
      {
        heading: 'Using InstaScrape Pro for Content Benchmarking',
        content: `InstaScrape Pro allows you to extract public post metrics across up to 10 profiles simultaneously. You can sort by total likes, inspect comment frequencies, and view real engagement charts to evaluate realistic baseline performance without algorithmic bias.`
      }
    ]
  },

  {
    slug: 'how-to-analyze-instagram-profile-presentation',
    path: '/resources/how-to-analyze-instagram-profile-presentation',
    title: 'How to Analyze Your Instagram Profile Presentation & First Impressions',
    shortTitle: 'Analyze Profile Presentation & First Impressions',
    description:
      'A framework to evaluate the 3-second first impression of an Instagram profile. Analyze visual hierarchy, value proposition, and bio readability.',
    primaryKeyword: 'how to analyze your Instagram profile presentation',
    supportingKeywords: [
      'Instagram profile first impressions',
      'evaluating Instagram bio and aesthetic',
      'profile positioning audit',
      'Instagram visual hierarchy'
    ],
    author: 'InstaScrape Pro Research Team',
    publishedDate: '2026-05-10',
    modifiedDate: '2026-10-12',
    readingTime: '6 min read',
    category: 'Presentation Analysis',
    relatedTool: '/instagram-profile-analyzer',
    relatedToolLabel: 'Run a Free Presentation Analysis',
    breadcrumb: [
      { name: 'Home', url: `${SITE_CONFIG.siteUrl}/` },
      { name: 'Resources', url: `${SITE_CONFIG.siteUrl}/resources` },
      { name: 'Analyze Profile Presentation', url: `${SITE_CONFIG.siteUrl}/resources/how-to-analyze-instagram-profile-presentation` }
    ],
    sections: [
      {
        heading: 'The Anatomy of a Profile First Impression',
        content: `Profile presentation is the sum of every visual and textual signal a user absorbs within their first few seconds on your page. When someone encounters your content via a Reel, a shared post, or a search result, tapping your handle is their first discovery step.

If your profile looks disorganized, unfocused, or inactive, even exceptional content will fail to convert views into followers.`
      },
      {
        heading: 'The 4 Pillars of Profile Presentation',
        content: `When auditing profile presentation, evaluate four distinct layers:

1. **Top Fold Coherence:** Do the avatar, handle, display name, and category immediately align? If your handle is "@techinsider" but your avatar is a pet photo, cognitive friction occurs.
2. **Readability & Formatting:** Does the bio utilize clean vertical rhythm, or does it require mental effort to parse?
3. **Value Clarity:** Is it obvious within one sentence why following this account will benefit the reader?
4. **Action Readiness:** Is there a clear, frictionless bridge between the profile and your external platform or offering?`
      },
      {
        heading: 'Objective Scoring Rubric',
        content: `InstaScrape Pro uses a 5-dimension presentation scoring rubric:

- **Clarity (1–10):** How easily can a stranger identify what you do?
- **Value Proposition (1–10):** Does the bio articulate a tangible outcome or unique perspective?
- **Call to Action (1–10):** Is there a singular, compelling invitation to interact with the link?
- **Readability (1–10):** Clean punctuation, natural line breaks, and appropriate emoji balance.
- **Link & Destination (1–10):** Functional destination with clear alignment to the bio promise.`
      },
      {
        heading: 'How to Continuously Benchmark Your Presentation',
        content: `Use InstaScrape Pro's Profile Analyzer to receive instant rubric scoring, objective strengths, and AI-suggested rewrites for any public profile. Regular benchmarking ensures your profile presentation remains polished and competitive.`
      }
    ]
  }
];

/**
 * Frequently Asked Questions (FAQ) Data for Landing Pages & Rich Schema
 */
export const LANDING_FAQS = {
  profileAnalyzer: [
    {
      question: 'How does the Instagram Profile Analyzer evaluate an account?',
      answer:
        'InstaScrape Pro retrieves the public profile metadata (display name, bio text, follower count, following count, verified status, and link presence) and applies an objective 5-factor scoring rubric using Google Gemini AI. It evaluates clarity, value proposition, call to action, readability, and link placement, providing concrete improvement suggestions.'
    },
    {
      question: 'Can I analyze a private Instagram profile?',
      answer:
        'No. InstaScrape Pro strictly respects Instagram privacy settings. For private profiles, our tool only verifies whether the handle exists and confirms its private status. We never attempt to bypass private restrictions or extract private media.'
    },
    {
      question: 'Do I need to enter my Instagram login or password?',
      answer:
        'No. InstaScrape Pro never requires your Instagram credentials, password, or account connection. All analyses are performed solely on publicly accessible Instagram information.'
    },
    {
      question: 'Is the profile analysis free to try?',
      answer:
        'Yes. Every new verified user account receives a complimentary free trial analysis to test the platform. Ongoing higher quotas are available through flexible subscription plans.'
    }
  ],

  bioAnalyzer: [
    {
      question: 'Why is an Instagram bio analyzer important for profile growth?',
      answer:
        'Your 150-character bio is the primary conversion choke-point on Instagram. Even high-performing Reels and posts fail to convert viewers into followers if the bio does not instantly communicate who you are, what value you provide, and what action to take next.'
    },
    {
      question: 'What makes a high-converting Instagram bio?',
      answer:
        'A high-converting bio features a concise niche definition, a clear value proposition, an authentic credibility anchor or social proof metric, a single call to action, and clean line breaks for mobile readability.'
    },
    {
      question: 'Can the tool rewrite my bio for me?',
      answer:
        'Yes. When analyzing your profile, InstaScrape Pro provides AI-suggested bio rewrites tailored to your niche, maintaining the 150-character limit while enhancing clarity and conversion potential.'
    }
  ],

  profileAudit: [
    {
      question: 'What is included in an Instagram Profile Audit?',
      answer:
        'Our profile audit evaluates your account presentation across 10 critical dimensions: handle readability, display name keyword relevance, avatar contrast, bio value proposition, CTA effectiveness, follower-to-following ratio, link destination health, and public interaction baseline.'
    },
    {
      question: 'How often should I audit my Instagram profile?',
      answer:
        'We recommend conducting an audit every 60 to 90 days, or whenever you launch a new product, pivot your service offering, or notice a plateau in follower conversion rates.'
    },
    {
      question: 'Can agencies use InstaScrape Pro to audit client accounts?',
      answer:
        'Yes. InstaScrape Pro is built for creators, marketers, founders, and digital agencies who need objective, presentation audits and public content datasets without algorithmic bias.'
    }
  ],

  contentResearch: [
    {
      question: 'What data can be extracted for Instagram content research?',
      answer:
        'InstaScrape Pro extracts public post captions, timestamps, like counts, comment counts, media types (photos, carousels, videos), post URLs, and calculated engagement rates for up to 10 public profiles simultaneously.'
    },
    {
      question: 'Can I export public Instagram post data to CSV or JSON?',
      answer:
        'Yes. All extracted public post metrics and captions can be exported with a single click to clean CSV or structured JSON files for use in spreadsheets, reporting tools, or custom analyses.'
    },
    {
      question: 'Does InstaScrape Pro scrape private posts or Instagram stories?',
      answer:
        'No. InstaScrape Pro operates strictly on publicly accessible feed posts. We do not scrape private accounts, private direct messages, or ephemeral private stories.'
    }
  ]
};

/**
 * Generate Structured Data (JSON-LD) for SEO
 */
export function generateSchema(pageKey, extraData = {}) {
  const schemas = [];

  // 1. Organization Schema (Global)
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    legalName: SITE_CONFIG.legalName,
    url: SITE_CONFIG.siteUrl,
    logo: `${SITE_CONFIG.siteUrl}/favicon.svg`,
    description: SITE_CONFIG.defaultDescription,
    email: SITE_CONFIG.supportEmail,
    sameAs: ['https://twitter.com/instascrapepro']
  });

  // 2. WebSite Schema with SearchAction (Homepage)
  if (pageKey === 'home') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_CONFIG.siteUrl}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });
  }

  // 3. SoftwareApplication Schema for Tools
  if (['home', 'profileAnalyzer', 'bioAnalyzer', 'profileAudit', 'contentResearch'].includes(pageKey)) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SEO_PAGES[pageKey]?.headline || SITE_CONFIG.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All modern web browsers',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        description: 'Free trial available for verified accounts'
      },
      description: SEO_PAGES[pageKey]?.description || SITE_CONFIG.defaultDescription
    });
  }

  // 4. BreadcrumbList Schema
  const breadcrumbs = SEO_PAGES[pageKey]?.breadcrumb || extraData?.breadcrumb;
  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: b.name,
        item: b.url
      }))
    });
  }

  // 5. FAQPage Schema for Landing Pages
  const faqs = LANDING_FAQS[pageKey];
  if (faqs && faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer
        }
      }))
    });
  }

  // 6. Article Schema for Resource Articles
  if (extraData?.article) {
    const art = extraData.article;
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: art.title,
      description: art.description,
      author: {
        '@type': 'Organization',
        name: art.author || SITE_CONFIG.name,
        url: SITE_CONFIG.siteUrl
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_CONFIG.siteUrl}/favicon.svg`
        }
      },
      datePublished: art.publishedDate,
      dateModified: art.modifiedDate,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': art.canonical || `${SITE_CONFIG.siteUrl}${art.path}`
      }
    });
  }

  return schemas;
}
