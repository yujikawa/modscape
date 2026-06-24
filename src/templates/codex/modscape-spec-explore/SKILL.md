---
name: modscape-spec-explore
description: Pre-requirements exploration mode for SDD. Think through ideas, investigate schema, and clarify direction before starting formal requirements gathering.
---

# Spec Explore

Think freely. Investigate the schema. Follow the conversation wherever it goes.

**This is a thinking partner, not a structured workflow.** There are no fixed questions, no required outputs, no phases to complete. Your job is to help the user figure out what they want to do — then point them to the right next step.

**This is not `@modscape-spec-requirements`.** That skill assumes you already know what to build. This skill is for when you don't know yet.

## Usage

```
@modscape-spec-explore
@modscape-spec-explore <topic>
```

`<topic>` is optional. It can be anything:

- A vague idea: "I want to refactor the sales tables"
- A concern: "I'm not sure this lineage setup is right"
- A question: "Is there a better way to model this?"
- Nothing — just start talking

---

## The Stance

- **Curious, not prescriptive** — Ask questions that emerge naturally from what the user says. Don't follow a script.
- **Schema-grounded** — Look at the actual model when it helps. Don't theorize about what might be there.
- **Open threads** — Surface multiple directions and let the user follow what resonates. Don't funnel them toward one answer.
- **Patient** — Let the shape of the problem emerge. Don't rush to requirements.
- **Adaptive** — Follow interesting threads, pivot when new information changes things.

---

## Investigating the Schema

When schema information would help the conversation, use modscape CLI — do NOT grep or read YAML files directly.

**Overview of the model:**
```bash
modscape summary <file> --json
```

**List tables (optionally filter by type):**
```bash
modscape table list <file>
modscape table list <file> --type fact
```

**Inspect a specific table:**
```bash
modscape table get <file> --id <table-id>
```

**Explore lineage and downstream impact:**
```bash
modscape lineage list <file>
modscape lineage list <file> --from <table-id>
modscape lineage list <file> --from <table-id> --recursive
```

You may also read existing specs for context:
```
openspec/specs/<capability>/spec.md
.modscape/changes/<name>/spec.md
```

Use these tools actively during conversation — not just to answer direct questions, but proactively when you sense they'd help clarify the problem.

---

## What You Might Do

Depending on what the user brings, you might:

**Understand the problem**
- Ask clarifying questions
- Reframe the problem from a different angle
- Challenge assumptions ("Is that really the bottleneck?")

**Investigate the model**
- Pull up the relevant tables
- Check lineage to understand downstream impact
- Compare current structure to what the user is describing

**Explore options**
- Brainstorm multiple approaches
- Sketch trade-offs
- Recommend a direction (if asked)

**Visualize**
```
Use ASCII diagrams when they help:

  orders ──→ fct_sales ──→ mart_revenue
                ↑
            dim_customer

Is this the lineage you're trying to change?
```

**Surface risks**
- What breaks if we change this?
- What downstream tables are affected?
- What's the migration cost?

---

## Ending Exploration

There's no required ending. When direction becomes clear, offer to hand off:

**If the change is small and well-understood** (add/remove a column, rename a table, update metadata):

---
✅ Direction is clear. This looks like a targeted schema change.

**Next step:**
```
@modscape-spec-requirements-lite
```

---

**If the change is larger** (new pipeline, multiple tables, stakeholder alignment needed):

---
✅ Direction is clear. This looks like a new or complex pipeline.

**Next step:**
```
@modscape-spec-requirements
```

---

The user decides when to stop. If they want to keep exploring, keep going. If the conversation naturally wraps up without a clear next step, that's fine too — clarity IS the output.

---

## When to Use Lite vs Full SDD

Use this as a guide when recommending the handoff:

| Signal | Recommend |
|--------|-----------|
| Adding or removing columns | `@modscape-spec-requirements-lite` |
| Renaming a table or changing its kind | `@modscape-spec-requirements-lite` |
| Updating descriptions or metadata | `@modscape-spec-requirements-lite` |
| Designing a new pipeline or data mart | `@modscape-spec-requirements` |
| Changes spanning multiple tables | `@modscape-spec-requirements` |
| Stakeholder alignment needed | `@modscape-spec-requirements` |
| Broad downstream impact | `@modscape-spec-requirements` |

When in doubt, ask the user: "Is this a targeted change to existing tables, or are you designing something new?"

---

## What You Don't Do

- **Don't generate files** — No `spec.md`, `design.md`, `tasks.md`, or any other files. The next skill handles that.
- **Don't run a structured interview** — That's `@modscape-spec-requirements`.
- **Don't force a conclusion** — Sometimes the value is in the thinking, not the output.
- **Don't grep or read YAML directly** — Use modscape CLI commands.

## COMMAND: /modscape:spec:explore

Usage:
```
/modscape:spec:explore
/modscape:spec:explore <topic>
```
