// The doctor's failure codes from its CI annotation (`@softure-ai/skills` doctor.py, `report_to_ci`): the message
// lists every code with its count, `code (count), code (count)`.
export interface DoctorFailureCode {
  readonly code: string;
  readonly count: number;
}

const PART_PATTERN = /^(.+?)\s*\((\d+)\)$/;

/** Each listed code with its count; a part without a count counts once, empty parts are skipped. */
export function parseFailureCodes(message: string): DoctorFailureCode[] {
  const codes: DoctorFailureCode[] = [];
  for (const raw of message.split(",")) {
    const part = raw.trim();
    if (part === "") {
      continue;
    }
    const match = PART_PATTERN.exec(part);
    const count = match === null ? 1 : Number(match[2]);
    codes.push({ code: match?.[1]?.trim() ?? part, count: count > 0 ? count : 1 });
  }
  return codes;
}

/** How many failures the codes add up to. */
export function countFailures(codes: readonly DoctorFailureCode[]): number {
  return codes.reduce((total, code) => total + code.count, 0);
}
