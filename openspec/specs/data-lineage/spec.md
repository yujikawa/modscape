## ADDED Requirements

### Requirement: Lineage Definition
The system SHALL support defining upstream dependencies in the YAML model using the top-level `lineage` section, where both `from` and `to` values may reference either a table ID, a consumer ID, or a metric ID.

Fact tables, dimension tables, and any other table type MAY appear as either `from` (source) or `to` (target) in a lineage entry. There is no restriction on which `appearance.type` can be used as a lineage source.

#### Scenario: Defining upstream tables
- **WHEN** a `lineage` entry references table IDs in both `from` and `to`
- **THEN** the system recognizes these as data flow dependencies between tables

#### Scenario: Fact table as lineage source
- **WHEN** a `lineage` entry has `from` referencing a table with `appearance.type: fact`
- **THEN** the system SHALL treat the fact table as a valid upstream source without errors or warnings

#### Scenario: Any table type as lineage source
- **WHEN** a `lineage` entry has `from` referencing a table of any `appearance.type` (fact, dimension, hub, satellite, mart, link, table)
- **THEN** the system SHALL accept it as a valid source without restricting based on type

#### Scenario: Lineage to a consumer node
- **WHEN** a `lineage` entry has a `to` value that matches a consumer ID (and not a table ID)
- **THEN** the system resolves the target as a consumer node and renders a lineage arrow to it

#### Scenario: Lineage to a metric node
- **WHEN** a `lineage` entry has a `to` value that matches a metric ID (and not a table ID or consumer ID)
- **THEN** the system resolves the target as a metric node and renders a lineage arrow to it

#### Scenario: Unknown ID in lineage
- **WHEN** a `lineage` entry has a `to` value that does not match any table ID, consumer ID, or metric ID
- **THEN** the system returns a validation error indicating the target was not found

### Requirement: Directional Data Flow Visualization
The system SHALL visualize table dependencies as directional animated dashed arrows (edges) pointing from upstream to downstream tables.

#### Scenario: Lineage Arrow Display
- **WHEN** "Lineage" toggle is active
- **THEN** the canvas shows dashed blue arrows connecting the center-right (source) of upstream tables to the center-left (target) of downstream tables.

### Requirement: Layer Identification
The system SHALL allow tables to be assigned to a specific data architectural layer (e.g., source, staging, mart) and visualize it as a floating tab on the top-left of the table node.

#### Scenario: Layer Badge Display
- **WHEN** a table has an assigned `appearance.layer`
- **THEN** the visualizer displays a floating tab indicating the layer name above the table node.

### Requirement: Independent Mode Toggling
The system SHALL provide independent toggles for ER (Entity Relationship) and Lineage (Data Flow) views, allowing them to be displayed simultaneously.

#### Scenario: Simultaneous Mode Interaction
- **WHEN** both "ER" and "Lineage" toggles are active
- **THEN** both relationship lines and flow arrows are displayed, but editing (creating new connections) is disabled to prevent ambiguity.

### Requirement: Smart ER Connections
The system SHALL allow users to create ER connections from any vertical handle (top/bottom) or column handle, automatically orienting the edge correctly regardless of the drag direction.

#### Scenario: Bidirectional Connection
- **WHEN** a user drags from a "Target" handle to a "Source" handle in ER mode
- **THEN** the system automatically swaps them to establish a valid directional relationship in the model.
