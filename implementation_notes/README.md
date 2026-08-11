# implementation_notes/

One file per sprint from `implementation.md`, named `sprint-NN-shortname.md`, following `TEMPLATE.md`.

**Purpose:** Antigravity has no memory across sessions. These notes are the persistence layer — before starting work, read the relevant sprint's note (and the prior sprint's Summary) instead of re-deriving context. While working, append to the Log section as things happen. Before ending a session, fill in or update the Summary even if the sprint isn't finished.

## Status index

Keep this table current — it's the fastest way for a new session to see where things stand without opening every file.

| Sprint | File | Status |
|---|---|---|
| 0 | [sprint-00-spike.md](file:///home/thanhtuan/projects/tvlnc/implementation_notes/sprint-00-spike.md) | done |
| 1 | [sprint-01-scaffold.md](file:///home/thanhtuan/projects/tvlnc/implementation_notes/sprint-01-scaffold.md) | done |
| 2 | [sprint-02-launcher-role.md](file:///home/thanhtuan/projects/tvlnc/implementation_notes/sprint-02-launcher-role.md) | done |
| 3 | [sprint-03-native-host.md](file:///home/thanhtuan/projects/tvlnc/implementation_notes/sprint-03-native-host.md) | done |
| 4 | [sprint-04-provider-enum.md](file:///home/thanhtuan/projects/tvlnc/implementation_notes/sprint-04-provider-enum.md) | done |
| 5 | [sprint-05-widget-cards.md](file:///home/thanhtuan/projects/tvlnc/implementation_notes/sprint-05-widget-cards.md) | done |
| 6 | [sprint-06-tv-navigation.md](file:///home/thanhtuan/projects/tvlnc/implementation_notes/sprint-06-tv-navigation.md) | done |
| 7 | [sprint-07-hardening.md](file:///home/thanhtuan/projects/tvlnc/implementation_notes/sprint-07-hardening.md) | done |

## Rules

- Never delete a Log entry — the log is append-only, even for things that turned out wrong. A dead end is exactly the kind of thing a future session needs to not repeat.
- Update this table's status column whenever a sprint file's own `status:` frontmatter changes.
- A sprint's Summary is the required reading before starting the next sprint — don't skip straight to implementation.md without checking it.
