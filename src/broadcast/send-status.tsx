// A project's send as a status word with its icon (statuses always carry both).
import { Status } from "@softure-ai/theme-notion";
import { CircleCheck, CircleDashed, Send, TriangleAlert } from "lucide-react";
import type { AppMessages } from "../../messages/index.ts";
import type { SendState } from "./build-broadcast-view.ts";

export function SendStatus({ state, copy }: { readonly state: SendState; readonly copy: AppMessages["broadcast"] }) {
  switch (state) {
    case "done":
      return <Status color="green" icon={CircleCheck}>{copy.states.done}</Status>;
    case "sent":
      return <Status color="blue" icon={Send}>{copy.states.sent}</Status>;
    case "failed":
      return <Status color="orange" icon={TriangleAlert}>{copy.states.failed}</Status>;
    case "sending":
      return <Status color="gray" icon={CircleDashed}>{copy.states.sending}</Status>;
  }
}
