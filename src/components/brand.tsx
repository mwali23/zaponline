import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="ZAP home">
      <span className="brand-mark" aria-hidden="true">Z</span>
      <span>
        <strong>ZAP</strong>
        <small>Zambia&apos;s Access to Power</small>
      </span>
    </Link>
  );
}
