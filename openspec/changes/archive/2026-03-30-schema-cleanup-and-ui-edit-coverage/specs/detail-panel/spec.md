## ADDED Requirements

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

