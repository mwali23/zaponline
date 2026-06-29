import Link from "next/link";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><Brand /><p>Community-powered electricity intelligence and trusted energy services for Zambia.</p></div>
        <div><strong>Explore</strong><Link href="/#power-map">Power map</Link><Link href="/marketplace">Marketplace</Link><Link href="/impact">Impact</Link></div>
        <div><strong>Build with us</strong><Link href="/providers">Become a provider</Link><Link href="/dashboard">Dashboard</Link><a href="mailto:partners@zaponline.org">Partner with ZAP</a></div>
        <div><strong>Trust</strong><Link href="/safety">Safety</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} ZAP. Built in Zambia.</span><span>Data should be independently verified before critical decisions.</span></div>
    </footer>
  );
}
