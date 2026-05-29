import { controlRecipe } from "../theme.css";

export function Input(props: { id: string; value: string; onChange: (value: string) => void; "aria-label"?: string }) {
  return <input className={controlRecipe()} id={props.id} value={props.value} onChange={(event) => props.onChange(event.target.value)} aria-label={props["aria-label"]} />;
}
