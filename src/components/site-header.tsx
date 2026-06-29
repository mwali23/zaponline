import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Brand } from "@/components/brand";

const links = [
  ["Power map", "/#power-map"],
  ["Marketplace", "/marketplace"],
  ["For providers", "/providers"],
  ["Impact", "/impact"],
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="nav-actions">
          <Link className="icon-link" href="/marketplace" aria-label="Search marketplace"><Search size={19} /></Link>
          <Link className="text-link" href="/sign-in">Sign in</Link>
          <Link className="button button-dark button-small" href="/report">Report outage</Link>
          <details className="mobile-menu">
            <summary aria-label="Open navigation"><Menu size={22} /></summary>
            <nav>{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
          </details>
        </div>
      </div>
    </header>
  );
}
