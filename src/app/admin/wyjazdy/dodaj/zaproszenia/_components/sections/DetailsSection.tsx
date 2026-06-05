"use client";

import type { TripContext } from "../../_lib/types";
import { formatDateRange } from "../../_lib/templateHelpers";

export default function DetailsSection({ tripContext }: { tripContext: TripContext }) {
  return (
    <div
      style={{
        backgroundColor: "#f3f8f9",
        borderLeft: "4px solid #287d88",
        borderRadius: "16px 0 16px 16px",
        padding: "18px 20px",
        margin: "0 0 22px",
      }}
    >
      <p style={{ margin: "0 0 3px", color: "#287d88", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
        Kiedy
      </p>
      <p style={{ margin: "0 0 12px", color: "#033f63", fontSize: 14, fontWeight: 600 }}>
        {formatDateRange(tripContext.startDate, tripContext.endDate)}
      </p>
      <p style={{ margin: "0 0 3px", color: "#287d88", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
        Gdzie
      </p>
      <p style={{ margin: 0, color: "#033f63", fontSize: 14, fontWeight: 600 }}>
        {tripContext.location || "Zakopane, Hotel Górski"}
      </p>
    </div>
  );
}
