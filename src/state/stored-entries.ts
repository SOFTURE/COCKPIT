// The owner-queue entries of a stored state (the scan's last good read), read defensively: an entry that does not
// match the schema is left out rather than failing the whole list.
import { z } from "zod";
import { ownerQueueEntrySchema, type OwnerQueueEntry } from "./state-schema.ts";

const storedStateSchema = z.object({ owner_queue: z.array(z.unknown()) });

export function getStoredEntries(state: unknown): OwnerQueueEntry[] {
  const parsed = storedStateSchema.safeParse(state);
  if (!parsed.success) {
    return [];
  }
  return parsed.data.owner_queue.flatMap((value) => {
    const entry = ownerQueueEntrySchema.safeParse(value);
    return entry.success ? [entry.data] : [];
  });
}
