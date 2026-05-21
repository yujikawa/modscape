## REMOVED Requirements

### Requirement: 実装中に発覚した問題を SDD 成果物に反映できる
**Reason**: `implement` スキルの inline 修正プロトコル（design.md → spec-model.yaml → 再生成）が `amend` の役割をカバーするようになったため廃止。`amend` が存在することで修正フローが複数経路に分散し、ユーザーが混乱する原因となっていた。
**Migration**: 実装後の修正が必要な場合は `implement` スキルの「修正指摘フロー」に従う。スキルが design.md を更新し、必要に応じてタスクを未完了に戻して再生成を行う。

### Requirement: amendコマンドのsaveヒント
**Reason**: `amend` コマンドの廃止に伴い、このヒント表示も不要となる。
**Migration**: なし。
