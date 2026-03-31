# schema-version Specification

## Purpose
The system SHALL support a root-level `version` field in the YAML model to indicate the schema version. This allows tooling, parsers, and AI agents to identify the format revision and apply appropriate parsing logic.

## Requirements

### Requirement: Root-Level Version Field
The YAML model SHALL support an optional root-level `version` field. The current schema version is `"1.0.0"`. The field is a string following semantic versioning conventions.

#### Scenario: Model with version field
- **WHEN** a YAML model contains `version: "1.0.0"` at the root level
- **THEN** the parser SHALL read and expose the `version` field on the parsed schema object

#### Scenario: Model without version field
- **WHEN** a YAML model has no `version` field
- **THEN** the parser SHALL default to `null` or `undefined` for the version, and the system SHALL continue to function without errors

### Requirement: Version Awareness in Parser
The parser SHALL read the `version` field and expose it on the schema object for use by downstream tools and AI agents.

#### Scenario: Parser exposes version
- **WHEN** a YAML model is parsed
- **THEN** the resulting schema object SHALL include a `version` property reflecting the value from the YAML (or `null` if absent)

### Requirement: Version in CLI Output
When a model's metadata is queried (e.g., via `modscape table list --json`), the output MAY include the schema `version` for machine-readable consumers.

#### Scenario: JSON output includes version
- **WHEN** a CLI command with `--json` flag reads a versioned model
- **THEN** the root-level JSON response SHOULD include a `version` field

### Requirement: Version in init Template
The `modscape init` and `modscape new` templates SHALL include `version: "1.0.0"` at the root of the generated YAML to encourage versioning from the start.

#### Scenario: New model includes version
- **WHEN** a user runs `modscape new model.yaml`
- **THEN** the generated `model.yaml` SHALL include `version: "1.0.0"` at the root level
