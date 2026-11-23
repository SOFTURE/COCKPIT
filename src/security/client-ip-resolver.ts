// Which header names the client: the source in CLIENT_IP_SOURCE (Cloudflare by default), trusted in production only
// on a request that carries the edge proof. On the host's shared edge network any container can reach the app
// directly; only the app's router knows EDGE_PROOF_SECRET and sets it (docker/prod/docker-compose.yml).
import { clientIpFromEnv, edgeProofIp, type ClientIpResolver } from "@softure-ai/security";

type ClientIpEnv = Readonly<Record<string, string | undefined>>;

/** The client-IP resolver for this environment; without EDGE_PROOF_SECRET (local runs, tests) the source as it is. */
export function getClientIpResolver(env: ClientIpEnv): ClientIpResolver {
  const secret = env.EDGE_PROOF_SECRET?.trim() ?? "";
  return edgeProofIp({ resolver: clientIpFromEnv(env), secret: secret === "" ? undefined : secret });
}
