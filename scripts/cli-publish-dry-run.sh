#!/usr/bin/env bash
# Everything a CLI publish does short of the registry (CMP-18): pack the package, `npm publish --dry-run`, then pack
# the tarball, install it into a scratch prefix and run the installed `cockpit`. Publishing itself is the
# `publish-cli` workflow's, run only on the owner's word.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
package_dir="${root}/dist/cli-package"
scratch="$(mktemp -d)"
trap 'rm -rf "${scratch}"' EXIT

cd "${root}"
node scripts/pack-cli.ts "${package_dir}"

echo "--- npm publish --dry-run"
(cd "${package_dir}" && npm publish --dry-run --access public)

echo "--- install the packed tarball and run it"
tarball="$(cd "${package_dir}" && npm pack --silent --pack-destination "${scratch}")"
npm install --global --prefix "${scratch}/prefix" --no-audit --no-fund "${scratch}/${tarball}" >/dev/null
"${scratch}/prefix/bin/cockpit" --help >"${scratch}/help.txt"
grep -q '^Usage: cockpit <command>' "${scratch}/help.txt"
set +e
COCKPIT_URL= COCKPIT_TOKEN= "${scratch}/prefix/bin/cockpit" overview 2>"${scratch}/no-address.txt"
code=$?
set -e
if [[ "${code}" -ne 2 ]] || ! grep -q '^No address:' "${scratch}/no-address.txt"; then
  echo "The installed cockpit did not refuse a missing address with exit 2 (got ${code})." >&2
  exit 1
fi
echo "CLI publish dry run passed: ${tarball} installs and runs."
