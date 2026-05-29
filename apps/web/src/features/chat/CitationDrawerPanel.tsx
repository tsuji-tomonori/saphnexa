import { CitationDrawer } from "@saphnexa/ui";
import type { ChatMessage, Citation, EventRow } from "../../types";

export function CitationDrawerPanel(props: { events: EventRow[]; messages?: ChatMessage[]; open: boolean }) {
  const citations = dedupeCitations([...extractRestCitations(props.messages ?? []), ...extractEventCitations(props.events)]);
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

export function extractRestCitations(messages: ChatMessage[]): Citation[] {
  return messages.flatMap((message) => message.citations ?? []).filter(isCitation);
}

export function extractEventCitations(events: EventRow[]): Citation[] {
  return events.flatMap((event) => {
    const citations = event.payload_json.citations;
    return Array.isArray(citations) ? citations.filter(isCitation) : [];
  });
}

export function dedupeCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    if (seen.has(citation.citation_id)) return false;
    seen.add(citation.citation_id);
    return true;
  });
}

function isCitation(value: unknown): value is Citation {
  if (!value || typeof value !== "object") return false;
  const citation = value as Record<string, unknown>;
  return typeof citation.citation_id === "string" && typeof citation.document_id === "string" && typeof citation.version_id === "string";
}
