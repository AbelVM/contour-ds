import "contour-ds/contour-wc.esm.js";

export default function Page() {
  return (
    <main className="container" style={{ paddingBlock: "var(--space-xl)" }}>
      <h1 className="c-section-head__title">Contour · Next consumer</h1>
      <p className="muted">A minimal Next.js app wired to the installed Contour package.</p>
      <button className="c-btn c-btn--primary" style={{ marginBlockStart: "var(--space-cluster)" }}>
        Compute route
      </button>
      <div className="c-kpi" style={{ marginBlockStart: "var(--space-cluster)" }}>
        <div className="c-kpi__value">42</div>
        <div className="c-kpi__label">Routes matched</div>
      </div>
    </main>
  );
}