export function Textarea(props: { value: string; onChange: (value: string) => void; "aria-label": string }) {
  return <textarea className="sx-textarea" value={props.value} onChange={(event) => props.onChange(event.target.value)} aria-label={props["aria-label"]} />;
}
