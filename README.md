# COCKPIT

A cockpit for SOFTURE projects: where every project stands and what waits for your decision.

## The problem

When one person or a small team runs several projects, each with its own AI agents delivering work in
its own repository, the hard part is no longer writing code. It is knowing, at a glance, which project
is moving, which one is blocked, and which one is waiting for you: a decision to make, a plan to
approve, a release to allow. That information is scattered across repositories, pull requests, issues
and chat threads.

COCKPIT gathers it in one place. It shows where each project stands and what waits for your decision,
and it turns a decision you make into work in that project.

## How it fits in the SOFTURE ecosystem

COCKPIT is the third part of SOFTURE:

| Part | Role |
|---|---|
| [SOFTURE/SKILLS](https://github.com/SOFTURE/SKILLS) (`@softure-ai/skills`) | Runs the delivery process inside each repository: shape, PRD, roadmap, plan, implement, review. |
| [SOFTURE/AI](https://github.com/SOFTURE/AI) (`@softure-ai/*`) | The building blocks apps are made of: auth, jobs, mailing, deploy, UI and more. |
| **SOFTURE/COCKPIT** (this repository) | Shows the state of every project and turns your decisions into work. |

## Contracts it builds on

- **Project state:** each watched repository publishes `context/state.json`
  ([SOFTURE/SKILLS#27](https://github.com/SOFTURE/SKILLS/issues/27)). COCKPIT reads it together with
  the forge API.
- **Decisions:** a decision made in COCKPIT is written back to the project as an owner-word issue
  ([SOFTURE/SKILLS#28](https://github.com/SOFTURE/SKILLS/issues/28)), which the project's agents pick up.

COCKPIT is read-only toward the repositories it watches, apart from creating those issues.

## Status

Early: being shaped, nothing to install yet. The product shape, stack and roadmap will be worked out
in the open under [`context/`](context/).

## License

[MIT](LICENSE)
