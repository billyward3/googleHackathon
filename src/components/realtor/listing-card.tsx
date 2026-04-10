import { ScoredListing } from "@/lib/realtor/types";

interface ListingCardProps {
  scored: ScoredListing;
  rank: number;
  selected: boolean;
}

export function ListingCard({ scored, rank, selected }: ListingCardProps) {
  const { listing, totalScore, warnings } = scored;
  const totalCost = listing.cost.monthly_rent + listing.cost.utilities;

  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        border: selected ? "2px solid #5ba89d" : "1px solid var(--line)",
        background: selected ? "rgba(91, 168, 157, 0.06)" : "rgba(255, 255, 255, 0.8)",
        boxShadow: selected ? "0 4px 12px rgba(91, 168, 157, 0.15)" : "none",
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{
            background: rank <= 3 ? "#5ba89d" : rank <= 10 ? "#7cb8b2" : "var(--ink-2)",
          }}
        >
          {rank}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold leading-tight" style={{ color: "var(--ink-1)" }}>
                {listing.site_name}
              </h3>
              <p className="text-xs" style={{ color: "var(--ink-2)" }}>
                {listing.address}
              </p>
            </div>
            <div
              className="text-lg font-bold tabular-nums"
              style={{ color: totalScore >= 60 ? "#3d7a71" : "var(--ink-1)" }}
            >
              {Math.round(totalScore)}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5 text-xs" style={{ color: "var(--ink-1)" }}>
            <span className="rounded px-1.5 py-0.5" style={{ background: "rgba(91, 168, 157, 0.1)" }}>
              {listing.unit.bedrooms} bed
            </span>
            <span className="rounded px-1.5 py-0.5" style={{ background: "rgba(91, 168, 157, 0.1)" }}>
              ${totalCost.toLocaleString()}/mo
            </span>
            {listing.accessibility.wheelchair_access && (
              <span className="rounded px-1.5 py-0.5" style={{ background: "rgba(91, 168, 157, 0.1)" }}>
                Wheelchair
              </span>
            )}
            {listing.accessibility.stairs === "none" && (
              <span className="rounded px-1.5 py-0.5" style={{ background: "rgba(91, 168, 157, 0.1)" }}>
                No stairs
              </span>
            )}
          </div>

          {warnings.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {warnings.map((w) => (
                <span
                  key={w}
                  className="rounded px-1.5 py-0.5 text-xs"
                  style={{ background: "rgba(194, 93, 93, 0.1)", color: "#a04545" }}
                >
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
