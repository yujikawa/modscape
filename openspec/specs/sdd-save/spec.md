> **廃止**: このスキル（save / load）は `modscape-spec-skill-cleanup`（2026-05-21）で廃止されました。セッション状態の把握には `status` コマンドを使用してください。

## REMOVED Requirements

### Requirement: saveコマンド
**Reason**: 実際の利用実績がなく、AI エージェントが会話コンテキストを保持する現在のワークフローでは不要と判断。セッション状態の外部保存は過剰な機能であり、スキルセットの簡素化のため廃止する。
**Migration**: なし。セッション状態の把握には `status` コマンドを使用すること。

### Requirement: session.md のフォーマット
**Reason**: `save` コマンドの廃止に伴い、不要となる。
**Migration**: なし。

### Requirement: 保存確認の表示
**Reason**: `save` コマンドの廃止に伴い、不要となる。
**Migration**: なし。
