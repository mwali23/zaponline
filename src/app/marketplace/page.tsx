import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Search, ShieldCheck } from "lucide-react";
import { getAvailableListings } from "@/lib/live-data";

export const metadata: Metadata = {
  title: "Energy services marketplace",
  description: "Find trusted solar, electrical, repair and backup-power services in Zambia.",
};

export default async function MarketplacePage() {
  const listings = await getAvailableListings();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Marketplace</span>
          </div>
          <span className="kicker">Verified local expertise</span>
          <h1>Find the right power solution.</h1>
          <p>
            Explore active energy resources, compare clear starting prices, and request quotes without sharing your
            phone number publicly.
          </p>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <div className="toolbar">
            <div className="search-box">
              <Search size={18} />
              <input className="input" aria-label="Search services" placeholder="Search solar, generators, repairs..." />
            </div>
            <select className="select" aria-label="Location">
              <option>All Copperbelt</option>
              <option>Kitwe</option>
              <option>Ndola</option>
              <option>Chingola</option>
            </select>
            <select className="select" aria-label="Sort">
              <option>Recommended</option>
              <option>Top rated</option>
              <option>Price: low first</option>
            </select>
          </div>

          <div className="market-layout">
            <aside className="filters">
              <h3>Filter results</h3>
              <div className="filter-group">
                <strong>Category</strong>
                {["Solar", "Repairs", "Electrical", "Rental", "Agriculture", "Consulting"].map((category) => (
                  <label key={category}>
                    <input type="checkbox" /> {category}
                  </label>
                ))}
              </div>
              <div className="filter-group">
                <strong>Trust</strong>
                <label>
                  <input type="checkbox" /> Verified providers
                </label>
                <label>
                  <input type="checkbox" /> 4.5+ rated
                </label>
              </div>
              <div className="filter-group">
                <strong>Availability</strong>
                <label>
                  <input type="checkbox" /> Emergency callout
                </label>
                <label>
                  <input type="checkbox" /> This week
                </label>
              </div>
            </aside>

            <div className="market-results">
              <div className="results-head">
                <strong>Energy services</strong>
                <span>{listings.length} active listings</span>
              </div>
              {listings.length > 0 ? (
                <div className="listing-grid">
                  {listings.map((listing, index) => (
                    <article className="listing-card" key={listing.slug}>
                      <div className={`listing-visual visual-${(index % 3) + 1}`}>
                        <span>{listing.category}</span>
                        <strong style={{ fontSize: 34 }}>{listing.initials}</strong>
                      </div>
                      <div className="listing-body">
                        <div className="provider-line">
                          <span className="avatar">{listing.initials}</span>
                          <span>{listing.provider}</span>
                          {listing.verified && <BadgeCheck size={16} className="verified" />}
                        </div>
                        <h3>{listing.title}</h3>
                        <p>{listing.blurb}</p>
                        <div className="tag-row">{listing.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                        <div className="listing-foot">
                          <div>
                            <strong>{listing.price}</strong>
                            <small>{listing.unit}</small>
                          </div>
                          <span>
                            ★ {listing.rating} <small>({listing.reviews})</small>
                          </span>
                        </div>
                        <Link className="button button-dark full" style={{ marginTop: 16 }} href={`/marketplace/${listing.slug}`}>
                          View service
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h3>No active resources are available yet.</h3>
                  <p>
                    Verified providers can publish listings, set availability windows, and deactivate resources when
                    they are no longer available.
                  </p>
                  <Link className="button button-primary" href="/providers">
                    Become a provider
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="buyer-safety">
            <ShieldCheck size={28} />
            <div>
              <strong>Never pay a provider off-platform before a written scope.</strong>
              <p>ZAP records quotes, milestones and receipts so there is a shared source of truth if something goes wrong.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
