export const STUDIO_URL = 'https://studio.moments.live';
export const STUDIO_LOGIN = `${STUDIO_URL}/admin/login`;
export const STUDIO_SIGNUP = `${STUDIO_URL}/admin/signup`;

export const navLinks = [
  { label: 'Reality', href: '#reality' },
  { label: 'Moments Studio', href: '#features', brand: 'studio' },
  { label: 'Moments App', href: '/guestApp', isRoute: true, brand: 'app' },
  { label: 'Pricing', href: '#pricing' },
];

export const heroData = {
  headline: 'Your Creative Hub.\nManage & Deliver Seamlessly.',
  subheadline: 'Media Management Built for Professionals',
  description: 'One platform to manage, deliver, and monetize your event photography — so you spend more time behind the lens and less time on admin.',
  ctaPrimary: 'Start Free Trial',
  ctaSecondary: 'See How It Works',
  dashboardImage: 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/p2naxnxo_studio.moments.live%20Prototype-1.png',
};

export const problemData = {
  sectionTag: 'The Reality',
  headline: "You're spending more time managing media than shooting it.",
  description: 'A photographer handling 20–40 events a year is burning hours on admin that has a real, untracked cost.',
  painPoints: [
    { icon: 'FolderOpen', title: 'Hours lost to manual media sorting after every event' },
    { icon: 'MessageCircle', title: 'WhatsApp and Drive links that expire, get lost, or frustrate clients' },
    { icon: 'RefreshCw', title: 'Repeat follow-ups eating into time you could bill for' },
    { icon: 'TrendingDown', title: 'No structured way to deliver a premium experience — or charge for one' },
  ],
};

export const dualValueData = {
  sectionTag: 'One Platform. Two Ways to Win.',
  headline: 'Manage more. Charge more. Deliver better.',
  layers: [
    {
      tag: 'Layer 1 — Your Backend',
      title: 'Media Management Platform',
      subtitle: 'This saves you money.',
      description: 'Professional media management for photographers. Upload, organise, sort, and deliver event media efficiently. Replace messy Drive folders and WhatsApp threads.',
      features: [
        'One dashboard for every event',
        'AI auto-tagging & organization',
        'Download controls & quality settings',
        'Team access for second shooters',
      ],
      image: 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/p2naxnxo_studio.moments.live%20Prototype-1.png',
    },
    {
      tag: 'Layer 2 — Your Client Upsell',
      title: 'Guest Experience App',
      subtitle: 'This earns you more.',
      description: 'A branded guest experience your clients can offer at their event. Guests scan a QR code, upload photos, and find themselves via face recognition. You charge for it.',
      features: [
        'QR code entry — no app download needed',
        'AI face recognition for instant photo finding',
        'Guests upload their own candid moments',
        'Position as a ₹5K–₹15K premium add-on',
      ],
      image: 'https://framerusercontent.com/images/R3U796O2tu9nCkGBUHnkHx4rI.png?scale-down-to=512',
      isPhone: true,
    },
  ],
};

export const platformFeaturesData = {
  sectionTag: 'The Platform',
  headline: 'Everything you need to run a tighter, faster media operation.',
  tagline: 'Less time on admin. Faster client review. Lower cost per event.',
  features: [
    {
      title: 'Fast Client Review',
      description: 'Clients review, shortlist, and approve galleries in hours — not weeks. Live feedback, favourites, and sign-off in one shareable link. No more endless WhatsApp back-and-forth.',
      image: 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/p2naxnxo_studio.moments.live%20Prototype-1.png',
    },
    {
      title: 'Smart Uploads & Processing',
      description: 'Bulk upload media with real-time processing. AI auto-tags and organizes the moment files are uploaded — zero manual sorting.',
      image: 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/wp4omh8t_studio.moments.live%20Prototype-2.png',
    },
    {
      title: 'Storage & Archive',
      description: 'Monitor usage, manage archives, and control storage across all your projects. Clear visibility into what\'s using space.',
      image: 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/yu40wpzb_studio.moments.live%20Prototype-3.png',
    },
    {
      title: 'Team Management',
      description: 'Bring in second shooters and studio teammates. Assign roles, control access, and collaborate seamlessly on every event.',
      image: 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/2bjonplv_studio.moments.live%20Prototype-4.png',
    },
    {
      title: 'Real-Time Notifications',
      description: 'Stay updated on uploads, team activity, deliveries, and client interactions — all in one activity feed.',
      image: 'https://customer-assets.emergentagent.com/job_moment-keeper-7/artifacts/ucmfqami_studio.moments.live%20Prototype-5.png',
    },
  ],
};

export const howItWorksData = {
  sectionTag: 'How It Works',
  headline: 'Set up once. Run it like a pro every time.',
  steps: [
    { number: '01', title: 'Create Event', description: 'Set up your event on the web platform — add sub-events, configure settings, invite team.', icon: 'Plus' },
    { number: '02', title: 'Upload Media', description: 'Photographer uploads media directly from the shoot via the web dashboard.', icon: 'Upload' },
    { number: '03', title: 'Guests Join', description: 'Guests scan QR code, access the gallery, and upload their own candid moments.', icon: 'QrCode' },
    { number: '04', title: 'AI Organizes', description: 'Auto-tagging, face recognition, and album creation runs automatically.', icon: 'Sparkles' },
    { number: '05', title: 'Client Receives', description: 'Beautiful, controlled gallery — shareable, branded, and download-managed.', icon: 'Heart' },
  ],
};

export const businessCaseData = {
  sectionTag: 'The Business Case',
  headline: "This isn't a cost — it's a profit lever.",
  saves: [
    'Hours of post-event media admin',
    'Days of client review & approval turnaround',
    'Storage and file transfer costs',
    'Back-and-forth client communication',
    'Risk of losing or misdelivering media',
  ],
  earns: [
    'Premium pricing for fast, professional delivery',
    '"Digital Guest Experience" add-on at ₹5K–₹15K per event',
    'Faster client sign-off = faster final payment',
    'Stronger referrals from impressed guests',
    'Repeat clients who associate your brand with excellence',
  ],
  callout: '20 events a year. Even a ₹5,000 upsell per event = ₹1,00,000 in additional revenue. The platform pays for itself — many times over.',
};

export const testimonialsData = {
  sectionTag: 'Early Feedback',
  headline: 'Already tested. Already loved.',
  subtitle: 'Piloted across 3 real weddings — here\'s what we heard.',
  stats: [
    { value: '3', label: 'Weddings Tested' },
    { value: '500+', label: 'Guests on App' },
    { value: '2,000+', label: 'Guest Photos Uploaded' },
    { value: '< 1hr', label: 'vs. Days Traditional' },
  ],
  testimonials: [
    {
      quote: "We thought we'd only have our photographer's shots, but Moments gave us hundreds of candid pictures from guests. It felt like reliving the wedding through everyone's eyes.",
      names: 'Rhea & Arjun',
      location: 'Udaipur',
      image: 'https://framerusercontent.com/images/wbFhpX5uSAGIwczrG2Ervvaj4ac.png?width=600',
    },
    {
      quote: 'By the next morning, we had everything beautifully organized. It was the easiest part of the whole wedding!',
      names: 'Ananya (Bride\'s Sister)',
      location: 'Mumbai',
      image: 'https://framerusercontent.com/images/OXF8xG3iqQafwQSyt2UnzF9vfg.png?width=600',
    },
    {
      quote: 'At such a big wedding, so many small moments get lost. With Moments, nothing slipped away — every smile, every dance step, every hug was waiting for us.',
      names: 'Siddharth & Meera',
      location: 'Delhi',
      image: 'https://framerusercontent.com/images/nRoPUCnNqKTD4j7rms4YwXUzmc.png?width=600',
    },
  ],
};

export const pricingData = {
  sectionTag: 'Pricing',
  headline: 'A subscription that earns its keep every single event.',
  description: 'Tiered subscription — pay for storage and capabilities, not per event. Unlimited events on every tier.',
  plans: [
    {
      name: 'Starter',
      subtitle: 'For solo photographers',
      price: '2,999',
      period: '/month',
      features: ['Unlimited events', '50GB storage', 'AI auto-tagging', 'Client gallery delivery', 'Single user access', 'Email support'],
      popular: false,
    },
    {
      name: 'Professional',
      subtitle: 'For growing studios',
      price: '5,999',
      period: '/month',
      features: ['Everything in Starter', '200GB storage', 'Guest Experience App access', 'Team access (up to 5)', 'Download controls', 'Priority support'],
      popular: true,
    },
    {
      name: 'Studio',
      subtitle: 'For agencies & large teams',
      price: '11,999',
      period: '/month',
      features: ['Everything in Professional', '1TB storage', 'Unlimited team members', 'White-label guest app (coming soon)', 'API access', 'Dedicated account manager'],
      popular: false,
    },
  ],
  trialCallout: 'Try the full platform — including Guest Experience features — on your next real event. No credit card. No commitment. Just results.',
};

export const whyNowData = {
  sectionTag: 'Why Now',
  headline: 'The photographers who move first will own the market.',
  reasons: [
    { title: 'Client expectations have shifted permanently', description: 'Couples and guests expect digital-first, instant, and beautiful. USB drives and Drive links signal you\'re behind.' },
    { title: 'AI has made premium possible for every photographer', description: 'Face recognition, auto-tagging, and instant delivery are no longer enterprise-only. You can offer them starting today.' },
    { title: 'Early adopters will build a referral moat', description: 'When 300 guests each leave with their photos on their phone, your name travels with every single image.' },
  ],
};

export const ctaData = {
  headline: 'Start your free trial. Try it on your next event.',
  description: 'Full access — media management platform + guest experience app — at no cost and no commitment.',
  primaryCTA: 'Start Free Trial',
  secondaryCTA: 'Want a walkthrough first? Let\'s talk.',
  contactLink: 'https://wa.me/918962364626',
};

export const footerData = {
  tagline: 'Media Management Built for Professional Photographers',
  email: 'hello@moments.live',
  platformLinks: [
    { label: 'Reality', href: '#reality' },
    { label: 'Moments Studio', href: '#features' },
    { label: 'Moments App', href: '/guestApp' },
    { label: 'Pricing', href: '#pricing' },
  ],
  companyLinks: [
    { label: 'About', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Delete Account', href: '/deleteAccount' },
  ],
  social: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'WhatsApp', href: 'https://wa.me/918962364626' },
  ],
};
