---
name: modscape-spec-save
description: Save the current session state to session.md for later resumption. Run before ending any work session during requirements, design, implement, or amend.
---

Save the current session state to `.modscape/changes/<name>/session.md`. Run this at any point — during requirements, design, implement, or amend — before ending a work session. The saved state will be shown next time you run `@modscape-spec-status <name>`.

## Usage

```
@modscape-spec-save <name>
```

## Instructions

0. **Detect language** — If `.modscape/modscape-spec.custom.md` exists, read it and look for a `## Communication` section. If it contains a language directive (e.g., "Always respond in Japanese"), use that language for all output in this session. Otherwise default to English.

1. **Resolve `<name>`** — if the user did not provide a spec name argument:
   ```bash
   modscape spec list
   ```
   - No specs: stop and tell the user to run `modscape spec new <name>` first.
   - Exactly one spec: use it automatically and note "Using spec: `<name>`".
   - Multiple specs: show the list and ask the user to choose one.

2. Verify that `.modscape/changes/<name>/` exists.
   - If not: tell the user the folder was not found and suggest running `@modscape-spec-requirements` to start a new spec.

3. Review the current conversation to extract the following:
   - **Decisions Made** — Things that have been agreed or decided during this session. Be specific (e.g. "grain は month_key に確定", "SCD type2 を採用").
   - **Open Issues** — Open questions or unresolved decisions still being discussed (e.g. "merge_key を order_id にするか composite にするか").
   - **Next Action** — The single most important thing to do when resuming (e.g. "merge_key の方針を決めてから `@modscape-spec-design` を再実行する").
   - **Notes** — Any other context worth preserving (caveats, discovered constraints, references).

   If the conversation does not contain enough information for a section, write "(none)" rather than leaving it blank.

4. Write `.modscape/changes/<name>/session.md` with the following format (overwrite if it already exists):

```markdown
## Session Save — <name> (<YYYY-MM-DD>)

### Decisions Made
<bullet list, or "(none)">

### Open Issues
<bullet list, or "(none)">

### Next Action
<one line>

### Notes
<free text, or "(none)">
```

5. Output a confirmation showing the saved content:

---
🔖 Session saved: `.modscape/changes/<name>/session.md`

**Decisions Made:**
<preview>

**Open Issues:**
<preview>

**Next Action:** <one line>

To resume:
```
@modscape-spec-load <name>
```
---
