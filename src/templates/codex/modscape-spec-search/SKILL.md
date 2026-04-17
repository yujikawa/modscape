---
name: modscape-spec-search
description: Search past archives and specs for a keyword, display relevant findings, and optionally incorporate selected results into the current spec or design on explicit request.
---

# Spec Search

Search past archives and specs for a keyword, display relevant findings, and optionally incorporate selected results into the current spec or design on explicit request.

## Instructions

1. Run the search command and capture JSON output:
   ```bash
   modscape spec search <keyword> --json --limit 10
   ```
   - If `.modscape/archives/` and `.modscape/specs/` do not exist or return no results, inform the user:
     > No results found for "<keyword>". No past archives or specs match this keyword.

2. Parse the JSON result. For each entry, read the matched file(s) to gather additional context (e.g., read `design.md` for design decisions, `spec.md` for pipeline goal and data sources).

3. Display a summary grouped by relevance:

   ```
   ## Search Results for "<keyword>"

   ### [1] archives/YYYY-MM-DD-<name>/
   **Title**: <spec title>
   **Type**: archive
   **Relevant content**:
   - design.md: <brief excerpt of design decision>
   - spec.md: Data Sources: <list>
   ```

4. After displaying the summary, ask the user if they want to incorporate any findings.

5. **Only on explicit user instruction**, incorporate the relevant parts:
   - Table definitions → apply to `.modscape/changes/<name>/spec-model.yaml` using mutation CLI commands
   - Design decisions → append to `.modscape/changes/<name>/design.md` under `## Related Past Specs`
   - Never auto-merge without explicit instruction

## COMMAND: /modscape:spec:search

Usage: `/modscape:spec:search <keyword>`
