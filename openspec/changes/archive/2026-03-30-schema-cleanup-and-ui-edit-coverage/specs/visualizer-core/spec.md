## REMOVED Requirements

### Requirement: Metadata Column Indicators
**Reason**: `isMetadata` フィールドをスキーマから削除したため。
**Migration**: 既存YAMLの `isMetadata` フィールドはパーサーにより無視される。

### Requirement: Business Definitions Display
**Reason**: `conceptual.businessDefinitions` フィールドをスキーマから削除したため。`description` フィールドで代替可能。
**Migration**: 既存YAMLの `businessDefinitions` フィールドはパーサーにより無視される。
