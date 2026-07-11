export type PowerStatus = "powered" | "outage" | "unstable" | "unknown";

export type DistrictPulse = {
  name: string;
  status: PowerStatus;
  reports: number;
  confidence: string;
  updated: string;
  schedule: string;
};

export const districts: DistrictPulse[] = [
  { name: "Kitwe", status: "outage", reports: 38, confidence: "High", updated: "8 min ago", schedule: "Restoration estimate: 14:00" },
  { name: "Ndola", status: "powered", reports: 21, confidence: "High", updated: "12 min ago", schedule: "No active outage" },
  { name: "Chingola", status: "unstable", reports: 17, confidence: "Medium", updated: "19 min ago", schedule: "Intermittent supply reported" },
  { name: "Mufulira", status: "powered", reports: 14, confidence: "High", updated: "25 min ago", schedule: "No active outage" },
  { name: "Luanshya", status: "outage", reports: 11, confidence: "Medium", updated: "31 min ago", schedule: "Planned: 10:00-16:00" },
  { name: "Kalulushi", status: "unknown", reports: 3, confidence: "Low", updated: "1 hr ago", schedule: "More reports needed" },
];

export type Listing = {
  slug: string;
  category: string;
  title: string;
  provider: string;
  initials: string;
  location: string;
  price: string;
  unit: string;
  rating: number;
  reviews: number;
  verified: boolean;
  featured?: boolean;
  blurb: string;
  tags: string[];
};

export const listings: Listing[] = [
  { slug: "home-solar-starter", category: "Solar", title: "Home solar starter system", provider: "Lumen Solar Zambia", initials: "LS", location: "Kitwe · serves Copperbelt", price: "K 8,900", unit: "installed", rating: 4.9, reviews: 47, verified: true, featured: true, blurb: "Panels, battery, inverter and professional installation for essential household loads.", tags: ["Warranty", "Site survey"] },
  { slug: "generator-repair", category: "Repairs", title: "Generator diagnosis & repair", provider: "Banda Power Works", initials: "BP", location: "Ndola · mobile service", price: "K 450", unit: "from", rating: 4.8, reviews: 31, verified: true, blurb: "Same-week troubleshooting for petrol and diesel generators, with clear parts estimates.", tags: ["Mobile", "Emergency"] },
  { slug: "business-backup-audit", category: "Consulting", title: "Small business backup-power audit", provider: "Copperbelt Energy Advice", initials: "CE", location: "Remote or on-site", price: "K 700", unit: "assessment", rating: 4.7, reviews: 19, verified: true, blurb: "Right-size solar, battery or generator options before spending on equipment.", tags: ["Independent", "Report"] },
  { slug: "battery-rental", category: "Rental", title: "Portable battery power station", provider: "Switch On Rentals", initials: "SO", location: "Kitwe · pickup", price: "K 180", unit: "per day", rating: 4.6, reviews: 26, verified: false, blurb: "Quiet short-term backup for phones, laptops, lights and small appliances.", tags: ["Daily rental", "Deposit"] },
  { slug: "solar-pump-install", category: "Agriculture", title: "Solar water pump installation", provider: "Green Current Co-op", initials: "GC", location: "Copperbelt rural districts", price: "Quote", unit: "after survey", rating: 4.9, reviews: 12, verified: true, blurb: "Borehole assessment, pump sizing, installation and farmer training.", tags: ["NGO ready", "Training"] },
  { slug: "electrical-safety", category: "Electrical", title: "Home electrical safety inspection", provider: "Mwila Electrical Services", initials: "ME", location: "Chingola · 30 km radius", price: "K 350", unit: "inspection", rating: 4.8, reviews: 55, verified: true, blurb: "Wiring, earthing and changeover inspection before adding backup power.", tags: ["Certified", "Checklist"] },
];

export const impactProjects = [
  { title: "Power a rural health post", location: "Lufwanyama", raised: 72, amount: "K 72,400", goal: "K 100,000", people: "4,800 residents" },
  { title: "Solar study hub for students", location: "Masaiti", raised: 46, amount: "K 23,100", goal: "K 50,000", people: "320 learners" },
  { title: "Market cold-storage pilot", location: "Mpongwe", raised: 88, amount: "K 132,000", goal: "K 150,000", people: "64 vendors" },
];
