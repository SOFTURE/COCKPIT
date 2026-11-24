// The wake adapter's read (CV-2): one GET of the project's `context/workflow.json` (Contents read, NFR-5), nothing
// written (NFR-7). A project without the file is not a SOFTURE project and shows nothing; a value the doctor would
// reject (`owner-word-wake-invalid`) reads as unknown, never as a wake-up.
import { z } from "zod";
import type { AdapterContext, AdapterRead } from "../contract.ts";
import { WORKFLOW_FILE_PATH, type WakeDeclaration } from "./owner-word-wake.ts";

const workflowSchema = z.object({ autonomy: z.object({ ownerWordWake: z.unknown().optional() }).loose().optional() }).loose();
const declaredSchema = z.enum(["routine", "heartbeat", "none"]);

export async function readWake({ client, project }: AdapterContext): Promise<AdapterRead<WakeDeclaration>> {
  const file = await client.getJsonFile(project.owner, project.name, WORKFLOW_FILE_PATH, project.branch);
  if (!file.ok) {
    if (file.kind === "rate_limited") {
      return { status: "rate_limited", retryAfterSeconds: file.retryAfterSeconds };
    }
    if (file.kind === "not_found") {
      return { status: "absent" };
    }
    return { status: "unknown", reason: file.kind === "invalid_answer" ? "workflow_invalid" : "workflow_unreadable" };
  }
  const workflow = workflowSchema.safeParse(file.value);
  if (!workflow.success) {
    return { status: "unknown", reason: "workflow_invalid" };
  }
  const declared = workflow.data.autonomy?.ownerWordWake;
  if (declared === undefined) {
    return { status: "value", value: { wake: "undeclared" } };
  }
  const wake = declaredSchema.safeParse(declared);
  return wake.success ? { status: "value", value: { wake: wake.data } } : { status: "unknown", reason: "wake_invalid" };
}
