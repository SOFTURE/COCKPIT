#!/usr/bin/env bash
# The deploy dry run: everything a release does short of the owner's server. Builds the production image from the
# Dockerfile, renders .env.prod from fictional values with `softure-deploy env render` (so every name the compose file
# requires is accounted for), brings the production compose file up on a local edge network (`up --wait`: postgres
# with its roles, migrate, app and worker healthy), then asks the health and build info routes, checks the digest
# settings reached the app and the worker, and dry-runs the create-account ops script inside the app container.
# Everything it starts is removed at the end.
#
# Usage: scripts/deploy-dry-run.sh   (needs Docker with the compose plugin; CI runs it in the job deploy-dry-run)
# DRY_RUN_IMAGE_BUILT=1 skips the build and uses ghcr.io/softure/cockpit:dry-run as it is (a machine whose builder
# needs its own proxy settings builds that image itself first).
set -euo pipefail

TAG="dry-run"
IMAGE="ghcr.io/softure/cockpit"
PROJECT="cockpit-dry-run"
EDGE_NETWORK="softure-edge"
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
  DIGEST_RECIPIENTS="owner@example.test" \
  DIGEST_AT="07:30" \
  npx softure-deploy env render --compose=docker/prod/docker-compose.yml --out="$WORK_DIR/.env.prod"
# deploy.sh writes the release tag into .env.prod on the server; the dry run does the same.
printf 'TAG=%s\n' "$TAG" >> "$WORK_DIR/.env.prod"

if ! docker network inspect "$EDGE_NETWORK" > /dev/null 2>&1; then
  docker network create "$EDGE_NETWORK" > /dev/null
  CREATED_NETWORK=true
fi

echo "dry-run: start the production stack"
compose config --quiet
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
const names = ["MAIL_FROM", "RESEND_API_KEY", "MAILING_UNSUBSCRIBE_SECRET", "DIGEST_RECIPIENTS", "DIGEST_AT"];
const missing = names.filter((name) => (process.env[name] ?? "") === "");
if (missing.length > 0) throw new Error(`missing digest settings: ${missing.join(", ")}`);
if (process.env.DIGEST_AT !== "07:30") throw new Error(`DIGEST_AT is ${process.env.DIGEST_AT}`);
console.log(`${names.length} digest settings set`);
'
done

echo "dry-run: create-account ops script (dry run, nothing written)"
compose exec -T app node ops/create-account.mjs --email=owner@example.com

echo "dry-run: ok"
