# Contributing

## Workflow

1. Create a feature branch off `main`: `git checkout -b feature/short-description`
2. Make your changes, with tests for any new logic.
3. Run `make lint` and `make test` locally before opening a pull request.
4. Open a pull request against `main` with a clear description of what
   changed and why.
5. At least one review is required before merging.

## Commit messages

Use short, imperative commit messages, e.g.:

```
Add clause segmentation for cross-referenced sub-conditions
Fix risk score rounding in review queue response
```

## Code standards

- Python code is formatted with `black` and linted with `ruff`; both run
  in CI and must pass before merge.
- Public functions and classes should have docstrings explaining purpose,
  not just parameters.
- Any change to a shared data contract (`ApplicantProfile`,
  `RegulatoryRequirement`, `ChecklistItem`) must be reflected in
  `docs/API.md` in the same pull request.

## Tests

- New logic should ship with tests. Prefer small, focused unit tests over
  broad integration tests where possible.
- If you fix a bug, add a regression test that would have caught it.

## Directory conventions

Each service under `services/` is self-contained: its own dependency
file, its own tests, its own README. Don't introduce cross-service
imports — services communicate only via the documented API contracts in
`docs/API.md`.
