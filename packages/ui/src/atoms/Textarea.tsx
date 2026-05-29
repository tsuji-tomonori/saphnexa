import { controlRecipe } from "../theme.css";

export function Textarea(props: { id?: string; value: string; onChange: (value: string) => void; "aria-label": string }) {
  return <textarea id={props.id} className={controlRecipe({ multiline: true })} value={props.value} onChange={(event) => props.onChange(event.target.value)} aria-label={props["aria-label"]} />;
}
