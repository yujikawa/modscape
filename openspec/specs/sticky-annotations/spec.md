# sticky-annotations Specification

## Purpose
TBD - created by archiving change add-sticky-annotations. Update Purpose after archive.
## Requirements
### Requirement: Annotation Persistence
The system SHALL persist visual annotations in a top-level `annotations` section in the YAML schema.

#### Scenario: Save annotation to YAML
- **WHEN** user creates an annotation and saves the schema
- **THEN** the YAML output SHALL contain an `annotations` section with the new note's ID, text, and metadata

### Requirement: Annotation Target Binding
The system SHALL allow binding an annotation to a specific modeling object (table, domain, relationship, or lineage edge) via a `targetId`. The `targetType` field SHALL accept the following values: `table`, `domain`, `relationship`, `column`, `lineage`.

#### Scenario: Binding to a table
- **WHEN** user creates a "sticky" annotation for table "orders"
- **THEN** the annotation record SHALL have `targetId: "orders"` and `targetType: "table"`

#### Scenario: Binding to a relationship
- **WHEN** user creates an annotation targeting a relationship that has an `id` field
- **THEN** the annotation record SHALL have `targetId` set to the relationship's `id` and `targetType: "relationship"`

#### Scenario: Binding to a lineage edge
- **WHEN** user creates an annotation targeting a lineage entry that has an `id` field
- **THEN** the annotation record SHALL have `targetId` set to the lineage entry's `id` and `targetType: "lineage"`

#### Scenario: Invalid targetType
- **WHEN** an annotation has a `targetType` that is not one of the accepted values
- **THEN** the parser SHALL emit a validation warning and treat the annotation as unbound

### Requirement: Sticky Positioning (Offset)
Annotations MUST maintain their visual position relative to their target object using a coordinate `offset`.

#### Scenario: Dragging a table with a sticky note
- **WHEN** user drags a table that has an attached sticky note
- **THEN** the sticky note SHALL move in sync with the table, maintaining its relative offset

### Requirement: Interactive Canvas Editing
The system SHALL allow users to create, edit, and delete annotations directly on the visual modeling canvas.

#### Scenario: Quick edit text
- **WHEN** user double-clicks an annotation on the canvas
- **THEN** the annotation SHALL enter an "edit mode" with an inline text input

### Requirement: Visual Callout and Sticky Styles
The system SHALL support different visual styles, including "sticky" (note on object) and "callout" (speech bubble pointing to object).

#### Scenario: Switching to callout style
- **WHEN** user changes an annotation's type to "callout"
- **THEN** the visualizer SHALL render a speech-bubble node and a connector line pointing to the target object

