import * as RadixTabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { tabsContentClass, tabsListClass, tabsTriggerClass } from "../theme.css";

export interface TabsItem {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs(props: { items: TabsItem[]; defaultValue: string; "aria-label": string }) {
  return (
    <RadixTabs.Root defaultValue={props.defaultValue}>
      <RadixTabs.List className={tabsListClass} aria-label={props["aria-label"]}>
        {props.items.map((item) => (
          <RadixTabs.Trigger key={item.id} className={tabsTriggerClass} value={item.id}>
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {props.items.map((item) => (
        <RadixTabs.Content key={item.id} className={tabsContentClass} value={item.id}>
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
