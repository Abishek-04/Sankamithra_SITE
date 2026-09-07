import Link from "next/link";
import { Box } from "@/components/Icons";

export default function NotFound() {
  return (
    <main id="main" className="section" style={{ paddingTop: "calc(var(--nav-h) + 6rem)" }}>
      <div className="shell">
        <div className="empty" style={{ boxShadow: "none" }}>
          <Box />
          <h1 className="h2">We couldn&apos;t find that page</h1>
          <p className="lead">It may have been renumbered in the 2026 list. Browse the full catalogue instead.</p>
          <Link className="btn" href="/products">Open the catalogue</Link>
        </div>
      </div>
    </main>
  );
}
