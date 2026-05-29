import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { drawerContentClass, overlayClass, titleClass } from "../theme.css";

export function Drawer(props: { open: boolean; title: string; children: ReactNode }) {
  return (
    <RadixDialog.Root open={props.open}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlayClass} />
        <RadixDialog.Content className={drawerContentClass} aria-label={props.title}>
          <RadixDialog.Title className={titleClass}>{props.title}</RadixDialog.Title>
          {props.children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
