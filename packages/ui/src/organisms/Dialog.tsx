import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { dialogContentClass, overlayClass, titleClass } from "../theme.css";

export function Dialog(props: { open: boolean; title: string; children: ReactNode }) {
  return (
    <RadixDialog.Root open={props.open}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlayClass} />
        <RadixDialog.Content className={dialogContentClass} aria-label={props.title}>
          <RadixDialog.Title className={titleClass}>{props.title}</RadixDialog.Title>
          {props.children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
