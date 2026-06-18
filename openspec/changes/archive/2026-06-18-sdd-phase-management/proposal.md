## Why

SDDワークフローの各スキル（answer・status・design など）が現在のフェーズ（requirements / design / tasks / implement / done）を確実に把握できていないため、`answer` スキルが常に「次は implement」と案内するなど、フェーズに無関係な次のステップを出力してしまっている。スキルがフェーズを判断できる信頼できる単一の情報源が存在しないことが根本原因。

## What Changes

- `spec-config.yaml` に `phase:` フィールドを追加し、フェーズ状態の単一の真実の源にする
- `modscape spec get <name> [--json]` コマンドを新設 — フェーズ・タスク進捗・質問数など spec の全情報を取得
- `modscape spec set-phase <name> <phase>` コマンドを新設 — フェーズを更新する（バリデーション付き）
- `modscape spec list` にフェーズ列を追加
- 各 SDD スキルの起動時・終了時に上記 CLI を呼ぶよう更新
  - 起動時: `modscape spec get` でフェーズを確認
  - 終了時: `modscape spec set-phase` でフェーズを更新
- `answer` スキルの「Next step」をフェーズに基づいた正しい案内に修正

## Capabilities

### New Capabilities

- `spec-phase-cli`: `modscape spec get` と `modscape spec set-phase` の CLI コマンド、および `spec-config.yaml` への `phase` フィールド追加

### Modified Capabilities

- `sdd-status`: フェーズ判定をファイル存在ベースから `spec-config.yaml` の `phase` フィールド読み取りに変更
- `sdd-answer`: Step 7 の「Next step」をフェーズ確認に基づいた正しいスキルへの誘導に修正
- `sdd-requirements`: 完了時に `modscape spec set-phase <name> requirements` を呼ぶよう追加
- `sdd-design`: 完了時に `modscape spec set-phase <name> design` を呼ぶよう追加
- `sdd-tasks`: 完了時に `modscape spec set-phase <name> tasks` を呼ぶよう追加
- `sdd-implement`: 完了時に `modscape spec set-phase <name> implement` を呼ぶよう追加
- `sdd-archive`: 完了時に `modscape spec set-phase <name> done` を呼ぶよう追加

## Impact

- `src/spec.js` — `specList`・`specGet`・`specSetPhase` 関数を追加・更新
- `src/index.js` — `spec get` / `spec set-phase` コマンドのルーティングを追加
- `src/templates/claude/spec/*.md` — 各スキルの SKILL.md を更新（claude / gemini / codex 全プラットフォーム）
- `src/templates/formats/spec-config-format.yaml` — `phase` フィールドを追加（存在する場合）
- 既存の `spec-config.yaml` は後方互換を保つ（`phase` が未設定の場合はファイル存在ベースでフォールバック）
