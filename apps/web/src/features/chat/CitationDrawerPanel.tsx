import { CitationDrawer } from "@saphnexa/ui";
import type { Citation, EventRow } from "../../types";

export function CitationDrawerPanel(props: { events: EventRow[]; open: boolean }) {
  const citations = extractCitations(props.events);
  return (
    <CitationDrawer
      open={props.open}
      citations={citations.map((citation) => ({
        citation_id: citation.citation_id,
        label: citation.display?.document_name ?? citation.document_id,
        location: [citation.display?.version_label, citation.display?.page ? `p.${citation.display.page}` : undefined, citation.display?.section]
          .filter(Boolean)
          .join(" / ")
      }))}
    />
  );
}

export function extractCitations(events: EventRow[]): Citation[] {
  return events.flatMap((event) => {
    const citations = event.payload_json.citations;
    return Array.isArray(citations) ? citations.filter(isCitation) : [];
  });
}

function isCitation(value: unknown): value is Citation {
  if (!value || typeof value !== "object") return false;
  const citation = value as Record<string, unknown>;
  return typeof citation.citation_id === "string" && typeof citation.document_id === "string" && typeof citation.version_id === "string";
}
