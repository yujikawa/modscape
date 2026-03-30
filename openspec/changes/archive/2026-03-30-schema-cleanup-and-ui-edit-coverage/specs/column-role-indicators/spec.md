## REMOVED Requirements

### Requirement: Metadata Column Indicators
**Reason**: `isMetadata` フィールドをスキーマから削除したため、このインジケーターは不要になった。
**Migration**: 既存YAMLに `isMetadata: true` が含まれている場合、パーサーはフィールドを無視する。表示への影響はない。
