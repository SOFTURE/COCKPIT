# Research: broadcast-count-under-a-growing-list

- Failing step: `e2e under load` of master run 45579312960, `e2e/broadcast.spec.ts:54`. The printed snapshot shows
  seven projects and "3 of 7 picked"; the spec computed `total = 6` before the list grew.
- Specs share one database and run in parallel in that step (ci.yml comment), so the watched list can grow at any
  moment; a newly shown project arrives unpicked because the picked set is initialised once on mount.
- `BroadcastForm` used `picked.size` for the count, both buttons' disabled state and the send button; a key from an
  earlier list would be counted.
