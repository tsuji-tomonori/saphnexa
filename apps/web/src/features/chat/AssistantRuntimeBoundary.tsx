import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { useMemo, type ReactNode } from "react";
import { createSaphnexaAssistantAdapter } from "../../lib/assistantRuntime";

export function AssistantRuntimeBoundary(props: {
  csrfToken: string;
  chatId: string | null;
  children: ReactNode;
}) {
  if (!props.chatId || !props.csrfToken) return <>{props.children}</>;
  return (
    <BoundAssistantRuntime csrfToken={props.csrfToken} chatId={props.chatId}>
      {props.children}
    </BoundAssistantRuntime>
  );
}

function BoundAssistantRuntime(props: { csrfToken: string; chatId: string; children: ReactNode }) {
  const adapter = useMemo(() => createSaphnexaAssistantAdapter(props.csrfToken, props.chatId), [props.chatId, props.csrfToken]);
  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {props.children}
    </AssistantRuntimeProvider>
  );
}
