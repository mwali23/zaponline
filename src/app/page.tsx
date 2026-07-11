import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  BellRing,
  Building2,
  ChevronRight,
  CircleCheck,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { MapShell } from "@/components/map-shell";
import { getAvailableListings, getDistrictPulses } from "@/lib/live-data";

function statusLabel(status: string) {
  return status.replace("-", " ").toUpperCase();
}

export default async function HomePage() {
  const [districtPulses, availableListings] = await Promise.all([getDistrictPulses(), getAvailableListings()]);
  const heroDistrict = districtPulses.find((district) => district.status === "outage") ?? districtPulses[0];
  const featuredListings = availableListings.slice(0, 3);
  const totalReports = districtPulses.reduce((sum, district) => sum + district.reports, 0);

  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" />
              Community-powered electricity intelligence
            </div>
            <h1>
              Know when power is out.
              <br />
              <em>Find a way forward.</em>
            </h1>
            <p>
              See trusted local power updates, report what you&apos;re experiencing, and hire verified energy
              professionals—all in one place.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="#power-map">
                Check my area <ArrowRight size={18} />
              </Link>
              <Link className="button button-ghost" href="/marketplace">
                Find energy services
              </Link>
            </div>
            <div className="trust-row">
              <span>
                <Users size={17} /> Community verified
              </span>
              <span>
                <ShieldCheck size={17} /> Safer payments
              </span>
              <span>
                <MapPin size={17} /> Built for Zambia
              </span>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-top">
              <span>Power pulse</span>
              <span className="status-chip powered">
                <i />
                Live
              </span>
            </div>
            <div className={`pulse-card ${heroDistrict?.status ?? "unknown"}`}>
              <div>
                <small>Current district signal</small>
                <h3>{heroDistrict?.name ?? "Copperbelt"}</h3>
              </div>
              <span>{statusLabel(heroDistrict?.status ?? "unknown")}</span>
            </div>
            <div className="estimate">
              <Clock3 size={18} />
              <div>
                <small>Current reading</small>
                <strong>{heroDistrict?.schedule ?? "Waiting for reports"}</strong>
              </div>
              <span>{heroDistrict?.confidence ?? "Needs reports"}</span>
            </div>
            <div className="signal-bars">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="panel-metrics">
              <div>
                <strong>{heroDistrict?.reports ?? 0}</strong>
                <small>active reports</small>
              </div>
              <div>
                <strong>{heroDistrict?.updated ?? "—"}</strong>
                <small>last update</small>
              </div>
              <div>
                <strong>{heroDistrict?.confidence ?? "—"}</strong>
                <small>confidence</small>
              </div>
            </div>
            <Link href="/report">
              Power back? Confirm the status <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="proof-strip">
        <div className="container proof-grid">
          <div>
            <strong>{districtPulses.length}</strong>
            <span>Copperbelt districts</span>
          </div>
          <div>
            <strong>{totalReports}</strong>
            <span>active reports</span>
          </div>
          <div>
            <strong>{availableListings.length}</strong>
            <span>active services</span>
          </div>
          <div>
            <strong>Live</strong>
            <span>Supabase-ready data</span>
          </div>
        </div>
      </section>

      <section className="section" id="power-map">
        <div className="container">
          <div className="section-heading split">
            <div>
              <span className="kicker">Power intelligence</span>
              <h2>What&apos;s happening near you?</h2>
              <p>
                Live community reports are combined with schedules and confirmations to show a confidence-weighted
                local picture.
              </p>
            </div>
            <Link className="arrow-link" href="/report">
              Report an outage <ArrowRight size={17} />
            </Link>
          </div>
          <div className="map-layout">
            <MapShell districts={districtPulses} />
            <aside className="district-panel">
              <div className="district-panel-head">
                <div>
                  <strong>District pulse</strong>
                  <small>Only active, unarchived reports are counted</small>
                </div>
                <span className="live-pill">LIVE</span>
              </div>
              {districtPulses.map((district) => (
                <div className="district-row" key={district.name}>
                  <i className={`status-dot ${district.status}`} />
                  <div>
                    <strong>{district.name}</strong>
                    <small>{district.schedule}</small>
                  </div>
                  <div>
                    <span>{district.reports} reports</span>
                    <small>{district.updated}</small>
                  </div>
                </div>
              ))}
              <Link className="button button-soft full" href="/report">
                <BellRing size={17} /> Get alerts for my area
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-heading split">
            <div>
              <span className="kicker">ZAP marketplace</span>
              <h2>Power solutions, without the guesswork.</h2>
              <p>
                Compare qualified providers, request clear quotes and pay through a protected marketplace workflow.
              </p>
            </div>
            <Link className="arrow-link" href="/marketplace">
              Browse all services <ArrowRight size={17} />
            </Link>
          </div>
          {featuredListings.length > 0 ? (
            <div className="listing-grid">
              {featuredListings.map((listing, index) => (
                <article className="listing-card" key={listing.slug}>
                  <div className={`listing-visual visual-${index + 1}`}>
                    <span>{listing.category}</span>
                    <Zap size={42} />
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
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No active marketplace resources yet.</h3>
              <p>When verified providers publish active listings, they will appear here automatically.</p>
              <Link className="button button-primary" href="/providers">
                Invite providers
              </Link>
            </div>
          )}
          <div className="buyer-safety">
            <ShieldCheck size={28} />
            <div>
              <strong>Designed for safer buying</strong>
              <p>
                Provider verification, scoped quotes, documented milestones and dispute support help both sides
                transact with clarity.
              </p>
            </div>
            <Link href="/safety">
              How protection works <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section how-section">
        <div className="container">
          <div className="section-heading centered">
            <span className="kicker">One practical platform</span>
            <h2>From uncertainty to action</h2>
          </div>
          <div className="steps-grid">
            <article>
              <span className="step-num">01</span>
              <div className="step-icon">
                <MapPin />
              </div>
              <h3>Check the power pulse</h3>
              <p>See current conditions and confidence levels in your district.</p>
            </article>
            <article>
              <span className="step-num">02</span>
              <div className="step-icon">
                <CircleCheck />
              </div>
              <h3>Share what you know</h3>
              <p>Confirm or report an outage in under a minute. Reputation controls discourage abuse.</p>
            </article>
            <article>
              <span className="step-num">03</span>
              <div className="step-icon">
                <BatteryCharging />
              </div>
              <h3>Choose your next move</h3>
              <p>Get alerts, plan around an outage, or find a trusted backup-power provider.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="impact-banner">
        <div className="container impact-inner">
          <div className="impact-icon">
            <Building2 />
          </div>
          <div>
            <span className="kicker light">Power access for communities</span>
            <h2>Turn outage data into measurable impact.</h2>
            <p>
              NGOs, donors and local organizations can sponsor verified community-energy projects and follow
              transparent milestones.
            </p>
          </div>
          <Link className="button button-light" href="/impact">
            Explore impact projects <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="section provider-cta">
        <div className="container cta-card">
          <div>
            <span className="kicker">
              <Sparkles size={14} /> For energy professionals
            </span>
            <h2>Grow a trusted energy business.</h2>
            <p>
              Reach customers who are actively looking for solutions, manage requests in one place, and build a
              portable reputation.
            </p>
            <div className="check-list">
              <span>
                <CircleCheck /> Verified public profile
              </span>
              <span>
                <CircleCheck /> Qualified local leads
              </span>
              <span>
                <CircleCheck /> Payment and job records
              </span>
            </div>
          </div>
          <Link className="button button-dark" href="/providers">
            Become a ZAP provider <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
