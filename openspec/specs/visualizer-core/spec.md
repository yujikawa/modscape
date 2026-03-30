## Purpose
The system SHALL provide an interactive visual canvas for data modeling, supporting multiple abstraction layers and intuitive diagramming.
## Requirements
### Requirement: YAML Parsing
The system SHALL parse a YAML definition to extract table metadata and relationships. The parser SHALL passthrough any unrecognized fields within a table (including `implementation`) without error.

#### Scenario: Successful Parsing
- **WHEN** a valid YAML file with tables and relations is provided
- **THEN** the system generates a internal representation of the data model

#### Scenario: Parsing table with implementation block
- **WHEN** a YAML file contains a table with an `implementation` block
- **THEN** the parser SHALL preserve the `implementation` object on the resulting `Table` object without validation or transformation

### Requirement: Diagram Rendering
The system SHALL render an interactive ER-style diagram on a canvas showing tables, their relationships, and optional domain containers, with visual cues for entity types and handles for relationship creation. Direct on-canvas delete buttons SHALL NOT be displayed on nodes or edges to maintain visual clarity.

#### Scenario: Visualizing Selection
- **WHEN** a user selects a table node
- **THEN** the diagram updates the visual style of connected edges to reflect the current focus, and no delete button is shown on the node.

#### Scenario: Edge Interaction
- **WHEN** an edge is rendered
- **THEN** it utilizes a custom edge component that focuses on relationship representation without on-canvas interactive buttons.

### Requirement: Table Selection
The system SHALL allow users to select a table on the canvas to view its details and perform contextual actions. Selection SHALL only be triggered by an explicit click event, not during or after a drag operation. Selection SHALL be cleared when the user clicks on the canvas background or finishes dragging a node.

#### Scenario: User clicks a table
- **WHEN** the user clicks on a table node without moving it
- **THEN** the table is highlighted and the detail panel is opened

#### Scenario: Selection for Contextual Actions
- **WHEN** a node or edge is selected
- **THEN** the system SHALL display its identity and available actions (like delete) in a centralized contextual toolbar.

#### Scenario: User clicks the background
- **WHEN** the user clicks on an empty area of the canvas
- **THEN** all selections are cleared and the detail panel is closed

#### Scenario: User stops dragging a node
- **WHEN** the user releases a node after dragging it
- **THEN** the node selection is cleared to keep the canvas focused on layout

### Requirement: Layout Rendering
The system SHALL render table nodes at coordinates specified in the YAML model's `layout` section.

#### Scenario: Rendering with layout
- **WHEN** a YAML model with node coordinates in the `layout` section is loaded
- **THEN** the React Flow nodes are initialized with those coordinates

### Requirement: Data Source Switching
The system SHALL allow the visualizer to load its data from an internal constant or an external JSON file in a CLI environment.

#### Scenario: Running in CLI dev mode
- **WHEN** the visualizer is launched by `modscape dev`
- **THEN** it fetches the initial YAML model from a local API endpoint instead of the manual input

### Requirement: Keyboard-Based Deletion
The system SHALL support deleting selected elements (nodes or edges) using standard keyboard keys.

#### Scenario: Deleting with Delete/Backspace
- **WHEN** one or more elements are selected on the canvas and the user presses the `Delete` or `Backspace` key
- **THEN** the selected elements are removed from the model.

### Requirement: Contextual Toolbar Actions
The system SHALL provide a centralized toolbar that displays information and actions for the currently selected element. This toolbar SHALL be positioned in the top-right of the canvas, separate from permanent tool controls.

#### Scenario: Toolbar Visibility
- **WHEN** an element is selected
- **THEN** the toolbar displays the element's name/type, a "Delete" action button, and a "Clear Selection" (X) button.

### Requirement: Permanent Vertical Toolbox
The system SHALL provide a permanent vertical toolbox on the top-left of the canvas for core view and creation actions.

#### Scenario: Toolbox Positioning
- **WHEN** the visualizer is launched
- **THEN** a vertical panel is fixed at the top-left, containing "View" and "Add" sections.

### Requirement: Resizable Detail Panel
The system SHALL allow users to manually adjust the height of the Detail Panel via a drag-and-drop interaction.

#### Scenario: Vertical Resizing
- **WHEN** the user drags the top border of the Detail Panel
- **THEN** the panel's height updates in real-time, following the mouse position within specified constraints (150px to 90vh).

### Requirement: Advanced Table Metadata Rendering
The system SHALL display both the table's nature (sub_type) and its history tracking method (scd) in the table header if defined.

#### Scenario: Fact table with both sub_type and scd
- **WHEN** a table has `type: fact`, `sub_type: transaction`, and `scd: type2`
- **THEN** the visualizer shows a badge or label indicating both (e.g., "FACT (Trans.) / SCD T2")

#### Scenario: Fact table without grain
- **WHEN** a table has `appearance.type: fact` and `appearance.sub_type` is undefined
- **THEN** the visualizer shows a badge labeled "FACT"

#### Scenario: Dimension table with scd only
- **WHEN** a table has `type: dimension` and `scd: type2` (with no sub_type)
- **THEN** the visualizer shows "DIM (SCD T2)"

#### Scenario: Dimension table without SCD type
- **WHEN** a table has `appearance.type: dimension` and `appearance.sub_type` is undefined
- **THEN** the visualizer shows a badge labeled "DIM"

### Requirement: Cross-Table SCD Assignment
The system SHALL allow users to assign an SCD Type to ANY table type (Fact, Dimension, Hub, Link, Satellite).

#### Scenario: Assigning SCD to a Fact table
- **WHEN** the user selects "SCD Type 2" for a Fact table in the Detail Panel
- **THEN** the `scd` property is set to `type2` while preserving the existing `sub_type` (e.g., `transaction`)

### Requirement: Optional Metadata Selection
The system SHALL allow users to explicitly deselect or leave analytics metadata (sub_type, additivity) as undefined via the UI.

#### Scenario: Deselecting Table Type
- **WHEN** the user selects the "-" option in the Table Type dropdown
- **THEN** the `sub_type` property is removed or set to undefined in the model

### Requirement: Column Additivity Indicators
The system SHALL display visual indicators for column additivity rules.

#### Scenario: Fully additive column
- **WHEN** a column has `logical.additivity: fully`
- **THEN** the visualizer displays the `Σ` (Sum) icon next to the column name

#### Scenario: Non-additive column
- **WHEN** a column has `logical.additivity: non`
- **THEN** the visualizer displays the `⊘` (Prohibited) icon next to the column name

### Requirement: Diagram Container Structure
The system SHALL wrap the diagram canvas in a container that allows for sibling elements in a vertical flow.

#### Scenario: Selection Cleared
- **WHEN** no node is selected
- **THEN** the diagram container expands to occupy the full available height of the right section

### Requirement: Annotation Node Rendering
The system SHALL render visual annotations (sticky notes and callouts) as a distinct layer of custom nodes on the React Flow canvas.

#### Scenario: Rendering a sticky note
- **WHEN** the schema contains an annotation of type `sticky`
- **THEN** the visualizer SHALL render a React Flow node using the `AnnotationNode` component at the calculated position

### Requirement: Annotation Connector Rendering
The system SHALL render a visual connector (edge) between an annotation and its target object if a `targetId` is defined.

#### Scenario: Rendering a callout connector
- **WHEN** an annotation has a `targetId` and `style.arrow: true`
- **THEN** the visualizer SHALL render a specialized React Flow edge connecting the annotation node to the target node

## ADDED Requirements

### Requirement: Data Refresh
The system SHALL provide a way to re-fetch the model data from the API without reloading the page.

#### Scenario: Refresh current model
- **WHEN** user clicks the "Refresh" button in the Sidebar
- **THEN** the system SHALL fetch the latest model content from the server
- **AND** update the canvas and editor with the new data
