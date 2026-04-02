## Why

リレーションシップとリネージのエッジに安定した ID が付与されたことで、エッジを「第一級のモデル要素」として扱える土台が整った。
しかし現状では、ID の可視化・説明フィールド・CLI での個別操作がいずれも欠如しており、エッジは構造的な接続に留まっている。
これらのギャップを埋めることで、データチームがエッジの意味をドキュメント化し、AI エージェントや CLI から安定して操作できる環境を提供する。

## What Changes

- **Relationship description フィールドの追加**: `relationships[].description` を YAML スキーマに追加。リネージエッジが持つ `description` との対称性を確立する
- **Detail Panel での ID 表示**: エッジ選択時に Detail Panel ヘッダーに ID を表示し、コピーボタンを提供する
- **CLI `relationship get` / `update` コマンドの追加**: `lineage` に存在する `get`・`update` に相当するサブコマンドを `relationship` に追加する
- **CLI `lineage get` コマンドの追加**: `lineage list` で全件、`lineage get --id` で1件取得できるように揃える

## Capabilities

### New Capabilities

- `relationship-description`: `relationships[]` エントリへの `description` フィールド追加（スキーマ・パーサー・UI・CLI）
- `edge-id-panel`: エッジ選択時に Detail Panel に ID を表示しコピーできる機能
- `relationship-get-update-cli`: `modscape relationship get` / `modscape relationship update` サブコマンド
- `lineage-get-cli`: `modscape lineage get` サブコマンド

### Modified Capabilities

- `relationship-id`: 既存 spec は「ID の自動生成と安定性」にフォーカスしているが、今回 `description` フィールドが加わることでスキーマ要件が拡張される
- `lineage-description`: 既存 spec は lineage の description のみを扱うが、今回 relationship 側に同等フィールドが追加されることで対称性の要件が生まれる

## Impact

| 対象 | 変更種別 |
|------|----------|
| `visualizer/src/types/schema.ts` | `Relationship` インターフェースに `description?: string` を追加 |
| `visualizer/src/lib/parser.ts` | description フィールドのパス・正規化 |
| `visualizer/src/components/DetailPanel.tsx` | エッジ ID 表示 + コピーボタン、Relationship description textarea 追加 |
| `src/relationship.js` | `get` / `update` サブコマンド追加 |
| `src/lineage.js` | `get` サブコマンド追加 |
| `src/templates/rules.md` | CLI フラグリファレンス更新 |
| `README.md` / `README.ja.md` | CLI リファレンス・スキーマ説明更新 |
| `CLAUDE.md` | YAML フォーマット例に description 追記 |
| `CHANGELOG.md` | v2.5.0 エントリ更新 |
