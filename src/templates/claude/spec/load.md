Load a previously saved session state from `.modscape/changes/<name>/session.md` into the current conversation. Deletes the file after loading so stale state does not accumulate.

## Usage

```
/modscape:spec:load <name>
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

2. Check whether `.modscape/changes/<name>/session.md` exists.
   - If not: tell the user no saved session was found for `<name>` and suggest running `/modscape:spec:save <name>` at the end of a session first.

3. Read `.modscape/changes/<name>/session.md` and extract all sections: date, Decisions Made, Open Issues, Next Action, Notes.

4. Delete `.modscape/changes/<name>/session.md`.

5. Output the loaded content and indicate it is now active context:

---
📂 Session loaded: `<name>` (<date>)

**Decisions Made:**
<bullet list, or "(none)">

**Open Issues:**
<bullet list, or "(none)">

**Next Action:** <one line>

**Notes:** <text, or "(none)">

This session context has been loaded into the current conversation. You can now resume from where you left off.
---
