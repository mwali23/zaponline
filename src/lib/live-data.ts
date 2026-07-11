import { districts as demoDistricts, listings as demoListings, type DistrictPulse, type Listing, type PowerStatus } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";

type DistrictStatusRow = {
  district_name: string | null;
  status: PowerStatus | null;
  total_reports: number | null;
  confidence_score: number | null;
  last_reported_at: string | null;
};

type ListingRow = {
  slug: string;
  category: string;
  title: string;
  description: string;
  provider_name: string | null;
  starting_price_minor: number | null;
  currency: string | null;
  pricing_unit: string | null;
  tags: string[] | null;
  rating_average: number | null;
  rating_count: number | null;
  provider_verification_status: string | null;
};

function confidenceLabel(score: number | null | undefined) {
  const value = Number(score ?? 0);
  if (value >= 0.75) return "High";
  if (value >= 0.45) return "Medium";
  if (value > 0) return "Low";
  return "Needs reports";
}

function statusSchedule(status: PowerStatus, reports: number) {
  if (!reports) return "No active community reports";
  if (status === "outage") return "Active outage reports";
  if (status === "unstable") return "Intermittent supply reported";
  if (status === "powered") return "Power reported on";
  return "More reports needed";
}

function relativeTime(value: string | null) {
  if (!value) return "No recent reports";
  const then = new Date(value).getTime();
  const seconds = Math.max(1, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ZP";
}

function formatPrice(minor: number | null, currency: string | null) {
  if (minor === null || minor === undefined) return "Quote";
  const major = minor / 100;
  if ((currency ?? "ZMW") === "ZMW") return `K ${major.toLocaleString("en-ZM", { maximumFractionDigits: 0 })}`;
  return new Intl.NumberFormat("en", { style: "currency", currency: currency ?? "ZMW" }).format(major);
}

function rowToListing(row: ListingRow): Listing {
  const provider = row.provider_name ?? "Verified ZAP provider";
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    provider,
    initials: initials(provider),
    location: "Serves active ZAP districts",
    price: formatPrice(row.starting_price_minor, row.currency),
    unit: row.pricing_unit ?? "from",
    rating: Number(row.rating_average ?? 0),
    reviews: Number(row.rating_count ?? 0),
    verified: row.provider_verification_status === "verified",
    blurb: row.description,
    tags: row.tags ?? [],
  };
}

export async function getDistrictPulses(): Promise<DistrictPulse[]> {
  const supabase = await createClient();
  if (!supabase) return demoDistricts;

  const { data, error } = await supabase
    .from("current_district_power_status")
    .select("district_name,status,total_reports,confidence_score,last_reported_at")
    .order("district_name");

  if (error || !data) return demoDistricts;

  return (data as DistrictStatusRow[]).map((row) => {
    const status = row.status ?? "unknown";
    const reports = Number(row.total_reports ?? 0);
    return {
      name: row.district_name ?? "District",
      status,
      reports,
      confidence: confidenceLabel(row.confidence_score),
      updated: relativeTime(row.last_reported_at),
      schedule: statusSchedule(status, reports),
    };
  });
}

export async function getAvailableListings(): Promise<Listing[]> {
  const supabase = await createClient();
  if (!supabase) return demoListings;

  const { data, error } = await supabase
    .from("available_service_listings")
    .select("slug,category,title,description,provider_name,starting_price_minor,currency,pricing_unit,tags,rating_average,rating_count,provider_verification_status")
    .order("updated_at", { ascending: false });

  if (error || !data) return demoListings;
  return (data as ListingRow[]).map(rowToListing);
}

export async function getAvailableListingBySlug(slug: string): Promise<Listing | null> {
  const supabase = await createClient();
  if (!supabase) return demoListings.find((listing) => listing.slug === slug) ?? null;

  const { data, error } = await supabase
    .from("available_service_listings")
    .select("slug,category,title,description,provider_name,starting_price_minor,currency,pricing_unit,tags,rating_average,rating_count,provider_verification_status")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return rowToListing(data as ListingRow);
}
