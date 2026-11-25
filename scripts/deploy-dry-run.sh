#!/usr/bin/env bash
# The deploy dry run: everything a release does short of the owner's server. Builds the production image from the
# Dockerfile, renders .env.prod from fictional values with `softure-deploy env render` (so every name the compose file
# requires is accounted for), brings the production compose file up on a local edge network named by EDGE_NETWORK (`up --wait`: postgres
# with its roles, migrate, app and worker healthy), then asks the health and build info routes, checks the digest
# settings reached the app and the worker, checks the MCP switches reached the app and that its MCP endpoint and OAuth
# discovery answer through the security module, checks the observability settings reached the worker and not the app,
# dry-runs the create-account ops script inside the app container and checks the grant-role ops script ships in
# it.
# Everything it starts is removed at the end.
#
# Usage: scripts/deploy-dry-run.sh   (needs Docker with the compose plugin; CI runs it in the job deploy-dry-run)
# DRY_RUN_IMAGE_BUILT=1 skips the build and uses ghcr.io/softure/cockpit:dry-run as it is (a machine whose builder
# needs its own proxy settings builds that image itself first).
set -euo pipefail

TAG="dry-run"
IMAGE="ghcr.io/softure/cockpit"
PROJECT="cockpit-dry-run"
# Not the default softure-edge: the stack must join the network EDGE_NETWORK names.
EDGE_NETWORK="cockpit-dry-run-edge"
WORK_DIR="$(mktemp -d)"
CREATED_NETWORK=false

compose() {
  docker compose --project-name "$PROJECT" --file "$WORK_DIR/docker-compose.yml" --env-file "$WORK_DIR/.env.prod" "$@"
}

cleanup() {
  local status=$?
  if [ "$status" -ne 0 ] && [ -f "$WORK_DIR/.env.prod" ]; then
    compose ps --all || true
    compose logs --no-color --tail=80 || true
  fi
  if [ -f "$WORK_DIR/.env.prod" ]; then compose down --volumes --remove-orphans > /dev/null 2>&1 || true; fi
  if [ "$CREATED_NETWORK" = true ]; then docker network rm "$EDGE_NETWORK" > /dev/null 2>&1 || true; fi
  rm -rf "$WORK_DIR"
  exit "$status"
}
trap cleanup EXIT

random_secret() { node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"; }

if [ "${DRY_RUN_IMAGE_BUILT:-}" = "1" ]; then
  echo "dry-run: use the image already built"
  docker image inspect "$IMAGE:$TAG" > /dev/null
else
  echo "dry-run: build the image"
  docker build --tag "$IMAGE:$TAG" --build-arg "SOFTURE_BUILD_COMMIT=$(git rev-parse HEAD)" .
fi

echo "dry-run: render .env.prod from fictional values"
cp -R docker/prod/. "$WORK_DIR/"
APP_HOST="cockpit.example.test" \
  EDGE_PROOF_SECRET="$(random_secret)" \
  FORGE_TOKEN="dry-run-token" \
  POSTGRES_PASSWORD="$(random_secret)" \
  SOFTURE_APP_PASSWORD="$(random_secret)" \
  SOFTURE_MIGRATOR_PASSWORD="$(random_secret)" \
  MAIL_FROM="COCKPIT <digest@example.test>" \
  RESEND_API_KEY="dry-run-key" \
  MAILING_UNSUBSCRIBE_SECRET="$(random_secret)" \
  SOFTURE_EMAIL_KEY_SECRET="$(random_secret)" \
  DIGEST_RECIPIENTS="owner@example.test" \
  DIGEST_AT="07:30" \
  MCP_ALLOW_WRITES="0" \
  MCP_DIAGNOSTICS="1" \
  GRAFANA_URL="https://grafana.example.test" \
  GRAFANA_TOKEN="dry-run-grafana-token" \
  ROUTINE_TOKEN_SECRET="$(random_secret)" \
  OTEL_EXPORTER_OTLP_ENDPOINT="http://127.0.0.1:4318" \
  OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic%20ZHJ5LXJ1bg==" \
  EDGE_NETWORK="$EDGE_NETWORK" \
  npx softure-deploy env render --compose=docker/prod/docker-compose.yml --out="$WORK_DIR/.env.prod"
# deploy.sh writes the release tag into .env.prod on the server; the dry run does the same.
printf 'TAG=%s\n' "$TAG" >> "$WORK_DIR/.env.prod"

if ! docker network inspect "$EDGE_NETWORK" > /dev/null 2>&1; then
  docker network create "$EDGE_NETWORK" > /dev/null
  CREATED_NETWORK=true
fi

echo "dry-run: start the production stack"
compose config --quiet
echo "dry-run: the stack joins the edge network EDGE_NETWORK names"
CONFIG="$(compose config --format json)"
node -e '
const config = JSON.parse(process.argv[1]);
const expected = process.argv[2];
const network = config.networks?.edge?.name;
const label = (config.services?.app?.labels ?? {})["traefik.docker.network"];
if (network !== expected || label !== expected) throw new Error(`edge network ${network}, label ${label}, expected ${expected}`);
console.log(`edge network: ${network}`);
' "$CONFIG" "$EDGE_NETWORK"
compose up --detach --wait --wait-timeout 240

echo "dry-run: health and build info"
compose exec -T app node -e '
const expectJson = async (path, check) => {
  const response = await fetch(`http://127.0.0.1:3000${path}`);
  const body = await response.json();
  if (response.status !== 200 || !check(body)) throw new Error(`${path} answered ${response.status} ${JSON.stringify(body)}`);
  console.log(`${path}: ${JSON.stringify(body)}`);
};
await expectJson("/api/health", (body) => body.status === "ok");
await expectJson("/api/health/build", (body) => body.release === process.env.SOFTURE_RELEASE && typeof body.commit === "string");
'

echo "dry-run: the digest settings reach the app and the worker"
for service in app worker; do
  compose exec -T "$service" node -e '
const names = ["MAIL_FROM", "RESEND_API_KEY", "MAILING_UNSUBSCRIBE_SECRET", "SOFTURE_EMAIL_KEY_SECRET", "DIGEST_RECIPIENTS", "DIGEST_AT"];
const missing = names.filter((name) => (process.env[name] ?? "") === "");
if (missing.length > 0) throw new Error(`missing digest settings: ${missing.join(", ")}`);
if (process.env.DIGEST_AT !== "07:30") throw new Error(`DIGEST_AT is ${process.env.DIGEST_AT}`);
console.log(`${names.length} digest settings set`);
'
done

echo "dry-run: the routine token secret reaches the app and the worker"
for service in app worker; do
  compose exec -T "$service" node -e '
if ((process.env.ROUTINE_TOKEN_SECRET ?? "").length < 32) throw new Error("ROUTINE_TOKEN_SECRET is missing or short");
console.log("ROUTINE_TOKEN_SECRET set");
'
done

echo "dry-run: the telemetry export settings reach the app and the worker"
for service in app worker; do
  compose exec -T "$service" node -e '
const names = ["APP_ENVIRONMENT", "OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_EXPORTER_OTLP_HEADERS", "SOFTURE_RELEASE"];
const missing = names.filter((name) => (process.env[name] ?? "") === "");
if (missing.length > 0) throw new Error(`missing telemetry settings: ${missing.join(", ")}`);
console.log(`${names.length} telemetry settings set`);
'
done

echo "dry-run: the MCP switches reach the app; the endpoint and its OAuth discovery answer"
compose exec -T app node -e '
if (process.env.MCP_ALLOW_WRITES !== "0" || process.env.MCP_DIAGNOSTICS !== "1") {
  throw new Error(`MCP switches are ${process.env.MCP_ALLOW_WRITES ?? "unset"}, ${process.env.MCP_DIAGNOSTICS ?? "unset"}`);
}
// As the router sends it: the edge proof and a client address (a documentation range), or the security module refuses.
const headers = { "X-Softure-Edge-Proof": process.env.EDGE_PROOF_SECRET, "CF-Connecting-IP": "203.0.113.10" };
const discovery = await fetch("http://127.0.0.1:3000/.well-known/oauth-protected-resource/api/mcp", { headers });
const resource = await discovery.json();
if (discovery.status !== 200 || resource.resource !== `${process.env.APP_ORIGIN}/api/mcp`) {
  throw new Error(`discovery answered ${discovery.status} ${JSON.stringify(resource)}`);
}
const call = await fetch("http://127.0.0.1:3000/api/mcp", {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
});
const challenge = call.headers.get("www-authenticate") ?? "";
if (call.status !== 401 || !challenge.includes("mcp:read")) {
  throw new Error(`/api/mcp without a token answered ${call.status} ${challenge}`);
}
// MCP_ALLOW_WRITES=0 above: the challenge asks for read access only.
if (challenge.includes("mcp:write")) throw new Error(`writes are still offered: ${challenge}`);
console.log(`MCP: discovery names ${resource.resource}; a call without a token answers 401, read only`);
'

echo "dry-run: the observability settings reach the worker, not the app"
compose exec -T worker node -e '
if (process.env.GRAFANA_URL !== "https://grafana.example.test" || (process.env.GRAFANA_TOKEN ?? "") === "") {
  throw new Error(`observability settings are ${process.env.GRAFANA_URL ?? "unset"}, token ${process.env.GRAFANA_TOKEN ? "set" : "unset"}`);
}
console.log("worker: GRAFANA_URL and GRAFANA_TOKEN set");
'
compose exec -T app node -e '
const leaked = ["GRAFANA_URL", "GRAFANA_TOKEN"].filter((name) => process.env[name] !== undefined);
if (leaked.length > 0) throw new Error(`the app got ${leaked.join(", ")}`);
console.log("app: no observability settings");
'

echo "dry-run: create-account ops script (dry run, nothing written)"
compose exec -T app node ops/create-account.mjs --email=owner@example.com

echo "dry-run: grant-role ops script ships in the image (the owner step after create-account)"
compose exec -T app test -f ops/grant-role.mjs

echo "dry-run: ok"
