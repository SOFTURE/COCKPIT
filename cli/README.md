# COCKPIT in a terminal

`cockpit` prints COCKPIT's overview, inbox and one project's detail as tables, with the same values as the screens,
or as JSON. It reads them through COCKPIT's MCP read tools, so it needs the address of a running COCKPIT and a read
token from its token page (Settings, Assistant access).

```sh
export COCKPIT_URL=https://cockpit.example.com
export COCKPIT_TOKEN=<read token>   # never a flag, so it stays out of shell history
npx @softure-ai/cockpit overview
npx @softure-ai/cockpit inbox --json
npx @softure-ai/cockpit project example-org/billing
```

Or install it once with `npm install --global @softure-ai/cockpit` and run `cockpit overview`. It needs Node 22 or
later and has no dependencies.

Times print in the terminal's time zone (`TZ`). It speaks the language in `COCKPIT_LOCALE` (`en` or `pl`), else
the terminal's (`LC_ALL`, then `LANG`). A missing token or address exits with 2, a refused token or an
unreachable COCKPIT with 1; both name the cause.

Source, issues and the app itself: https://github.com/SOFTURE/COCKPIT (MIT).
