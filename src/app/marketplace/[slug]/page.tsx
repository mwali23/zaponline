import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Check, MapPin, ShieldCheck } from "lucide-react";
import { listings } from "@/lib/demo-data";

export function generateStaticParams() {
  return listings.map(({ slug }) => ({ slug }));
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = listings.find((listing) => listing.slug === slug);

  if (!item) notFound();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/marketplace">Marketplace</Link>
            <span>/</span>
            <span>{item.category}</span>
          </div>
          <span className="kicker">{item.category}</span>
          <h1>{item.title}</h1>
          <p>{item.blurb}</p>
        </div>
      </section>
      <section className="content-section">
        <div className="container listing-detail-layout">
          <div>
            <div className="provider-line">
              <span className="avatar">{item.initials}</span>
              <strong>{item.provider}</strong>
              {item.verified && <BadgeCheck className="verified" size={18} />}
            </div>

            <h2 style={{ fontSize: 32, marginTop: 30 }}>What&apos;s included</h2>
            <div className="service-includes">
              {[
                "A documented assessment before work begins",
                "Written scope, timeline and price",
                "Installation or service by the listed provider",
                "Completion evidence and customer sign-off",
              ].map((detail) => (
                <p key={detail}>
                  <Check size={18} />
                  {detail}
                </p>
              ))}
            </div>

            <h2 style={{ fontSize: 32, marginTop: 38 }}>Provider details</h2>
            <p>
              <MapPin size={16} style={{ verticalAlign: "middle" }} /> {item.location}
            </p>
            <p>
              ★ {item.rating} from {item.reviews} customer reviews
            </p>
          </div>

          <aside className="form-card quote-card">
            <small>Starting at</small>
            <h2>{item.price}</h2>
            <p>{item.unit}. Final pricing follows a written quote.</p>
            <Link className="button button-primary full" href="/sign-in?next=request">
              Request a quote
            </Link>
            <div className="notice">
              <ShieldCheck size={16} style={{ verticalAlign: "middle" }} /> Keep messages and payments on ZAP to
              preserve your transaction record.
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
