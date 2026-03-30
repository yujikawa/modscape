# detail-panel Specification

## Purpose
The system SHALL provide a slide-up Detail Panel that displays and allows editing of metadata for the currently selected entity (table, domain, relationship, or annotation).

## Requirements

### Requirement: Tabbed Detail Panel
The system SHALL display a panel containing tabs for metadata relevant to the currently selected item (table, domain, or relationship).

#### Scenario: Opening the panel
- **WHEN** a table, domain, or a relationship is selected in the diagram
- **AND** the detail panel is NOT minimized
- **THEN** the panel SHALL be rendered at the bottom of the right section with its full content populated

#### Scenario: Selection while minimized
- **WHEN** the detail panel is minimized (collapsed to a bar)
- **AND** the user selects a DIFFERENT item in the diagram
- **THEN** the panel SHALL remain minimized
- **AND** the label on the minimized bar SHALL update to the new item's name

#### Scenario: Relationship Selection
- **WHEN** a relationship edge is selected
- **THEN** the panel displays relationship-specific configuration (type, cardinality) and allows direct modification

### Requirement: Layer Specific Views
The system SHALL show the appropriate metadata for the selected tab.

#### Scenario: Switching to Physical tab
- **WHEN** the user clicks the "Physical" tab in the detail panel
- **THEN** the panel displays physical column names, data types, and constraints

#### Scenario: Switching to Logical tab with no data
- **WHEN** the user clicks the "Logical" tab for a table with no columns
- **THEN** the panel displays a message like "No logical columns defined yet" instead of a blank or crashed view

### Requirement: Conceptual Metadata
The system SHALL display description and tags in the Conceptual tab.

#### Scenario: Viewing Conceptual tab
- **WHEN** the "Conceptual" tab is active
- **THEN** the business description of the table and BEAM* tags (WHO, WHAT, etc.) are shown

#### Scenario: Viewing Conceptual tab with no description
- **WHEN** the "Conceptual" tab is active and the table has no description or tags
- **THEN** it displays "No description provided." and hides the tags section

### Requirement: Resilient Sample Tab
The system SHALL handle missing sample data gracefully within the detail panel.

#### Scenario: Viewing Sample Data tab with no data
- **WHEN** the "Sample Data" tab is active but no data is in the YAML
- **THEN** it displays "No sample data available for this table."

### Requirement: Detail Panel Minimization
The system SHALL allow users to minimize the detail panel to a narrow bar at the bottom of the screen to maximize canvas space.

#### Scenario: Minimize the panel
- **WHEN** the user clicks the "Minimize" button on the detail panel header
- **THEN** the panel height SHALL shrink to a fixed small value (e.g., 40px)
- **AND** the main content of the panel SHALL be hidden

#### Scenario: Restore from minimized bar
- **WHEN** the user clicks anywhere on the minimized bar
- **THEN** the panel SHALL restore to its previous or default expanded height

#### Scenario: Force expand on double-click
- **WHEN** the user double-clicks an entity node or relationship edge in the canvas
- **THEN** the system SHALL select the item AND ensure the detail panel is expanded (even if it was previously minimized)

### Requirement: Table Appearance Icon Editing
The system SHALL allow users to edit `appearance.icon` (emoji) from the DetailPanel.

#### Scenario: Editing icon
- **WHEN** the user types an emoji into the icon input field in the DetailPanel header area
- **THEN** the table's `appearance.icon` is updated and reflected on the canvas immediately

### Requirement: Table Appearance Color Editing
The system SHALL allow users to edit `appearance.color` (header color) from the DetailPanel using a color picker.

#### Scenario: Editing header color
- **WHEN** the user selects a color from the color picker in the DetailPanel
- **THEN** the table's `appearance.color` is updated and the table card header reflects the new color immediately

#### Scenario: Default color display
- **WHEN** `appearance.color` is not set
- **THEN** the color picker displays the type's built-in default color (from TYPE_CONFIG)

### Requirement: Foreign Key Toggle
The system SHALL provide a toggle button for `columns[].logical.isForeignKey` in the Logical tab of the DetailPanel.

#### Scenario: Toggling foreign key flag
- **WHEN** the user clicks the FK toggle button (🔩) on a column row
- **THEN** `isForeignKey` is toggled and the icon is displayed or hidden accordingly on the table card

### Requirement: Partition Key Toggle
The system SHALL provide a toggle button for `columns[].logical.isPartitionKey` in the Logical tab of the DetailPanel.

#### Scenario: Toggling partition key flag
- **WHEN** the user clicks the PK toggle button (📂) on a column row
- **THEN** `isPartitionKey` is toggled and the icon is displayed or hidden accordingly on the table card
