## Why

現行のSDDフローは「何を作るか決まっている」前提で設計されており、`modscape-spec-requirements` は構造化インタビュー形式で始まる。しかし実際の開発では「今こう実装しているがもっとよい方法がないか」「こういう課題があるがどうアプローチすべきか」といった、要件がまだ固まっていない段階から相談したいケースが多く、既存フローへの入口として機能するスキルが不足している。

## What Changes

- `modscape-spec-explore` スキルを新規追加（`src/templates/gemini/modscape-spec-explore/SKILL.md`）
  - SDD開発の前要件フェーズをカバーする会話型探索スキル
  - やりたいことが曖昧な状態・課題感だけある状態でも開始できる
  - modscape MCPツールを使いながらschema/lineage/既存specを参照し、ユーザーと一緒に方針を固める
  - 固定の質問リストはなく、ユーザーの話の流れに沿って自由に探索する
  - 方針が固まったら次のスキルを案内して終了（ファイルは生成しない）
    - 軽微な変更 → `@modscape-spec-requirements-lite`
    - 新規/複雑な変更 → `@modscape-spec-requirements`
- 既存スキルへの変更なし

## Capabilities

### New Capabilities

- `modscape-spec-explore`: SDD開発の前要件フェーズを担う会話型探索スキル。やりたいことが曖昧な状態から始め、schema調査と対話を通じて方針を固め、適切な要件スキルへ案内する。

### Modified Capabilities

（なし）

## Impact

- `src/templates/gemini/modscape-spec-explore/SKILL.md` を新規作成
- 既存スキル・コマンド・テンプレートへの影響なし
