// Whether assistants may answer entries over MCP (FR-14). On unless `MCP_ALLOW_WRITES=0`: an answer still needs a
// write token or an OAuth grant with write access, which the owner issues on purpose.
export function isMcpWritingAllowed(value: string | undefined): boolean {
  return value?.trim() !== "0";
}
