# yaml-diff-viewer Specification

## Purpose
YAMLビューアに unified diff 表示機能を提供し、ディスク上のファイルとUIでの編集差分をユーザーが把握できるようにする。

## Requirements

### Requirement: Diff Toggle
The system SHALL provide a toggle button in the YAML sidebar tab header to enable or disable diff view.

#### Scenario: Enabling diff view
- **WHEN** the user clicks the "Diff" toggle button (OFF → ON)
- **THEN** the YAML viewer switches to unified diff display

#### Scenario: Disabling diff view
- **WHEN** the user clicks the "Diff" toggle button (ON → OFF)
- **THEN** the YAML viewer returns to normal YAML display with no diff computation

### Requirement: Unified Diff Display
The system SHALL display a unified diff between the baseline YAML (last loaded from disk) and the current in-memory YAML.

#### Scenario: Changes exist
- **WHEN** diff view is ON and the current YAML differs from the baseline
- **THEN** added lines are displayed with a `+` prefix and green background
- **AND** removed lines are displayed with a `-` prefix and red background
- **AND** unchanged lines are displayed normally

#### Scenario: No changes
- **WHEN** diff view is ON and the current YAML is identical to the baseline
- **THEN** the system displays "No changes" message

### Requirement: Baseline Snapshot
The system SHALL maintain a baseline YAML snapshot that represents the last state loaded from disk.

#### Scenario: Model load
- **WHEN** a model is loaded (initial load or file switch)
- **THEN** the baseline is set to the loaded YAML string

#### Scenario: External file change
- **WHEN** an external file change is received via WebSocket and refreshModelData completes
- **THEN** the baseline is updated to the newly fetched YAML string
