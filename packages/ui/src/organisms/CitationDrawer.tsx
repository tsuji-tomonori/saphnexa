import type { ReactNode } from "react";
import { Drawer } from "./Drawer";

export interface CitationDrawerItem {
  citation_id: string;
  label: string;
  location?: string;
}

export function CitationDrawer(props: { open: boolean; citations: CitationDrawerItem[]; children?: ReactNode }) {
  return (
    <Drawer open={props.open} title="引用">
      {props.citations.length === 0 ? (
        <p role="status">引用はありません</p>
      ) : (
        <ol aria-label="引用一覧">
          {props.citations.map((citation) => (
            <li key={citation.citation_id}>
              <span>{citation.label}</span>
              {citation.location ? <small>{citation.location}</small> : null}
            </li>
          ))}
        </ol>
      )}
      {props.children}
    </Drawer>
  );
}
