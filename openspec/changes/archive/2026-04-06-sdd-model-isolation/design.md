## Context

現行SDDのdesignスキルは `modscape table add HR.yaml` のように本番YAMLを直接mutationする。これは単一spec運用では問題ないが、並行spec作業時に本番YAMLが作業途中の状態になる。

既存コマンドの状況:
- `modscape extract` — テーブルIDを指定してYAMLから抜き出す（既存）
- `modscape merge` — 複数YAMLをfirst-winsでマージ（既存・軽微な変更のみ必要）

## Goals / Non-Goals

**Goals:**
- designステップで本番YAMLを一切変更しない
- `sdd/<name>/model.yaml` を作業単位の独立したYAMLとして管理する
- archiveでspec変更をHR.yamlに反映する（spec側優先）
- 重複テーブル検出時に警告を出す（ブロックはしない）

**Non-Goals:**
- カラムレベルのマージ（同一テーブルの複数spec競合は警告のみ）
- `sdd/<name>/model.yaml` のバージョン管理（gitに委ねる）
- 本番YAMLの自動バックアップ

## Decisions

### 1. designは extract → 作業用YAML → 設計 の順

```
AIがspec.mdのData Sourcesを読む
    ↓
modscape extract HR.yaml --tables fct_orders,dim_customers \
  --output sdd/<name>/model.yaml
    ↓
AIが新規テーブルをsdd/<name>/model.yamlに追加（mutation CLIの対象はこちら）
    ↓
modscape layout sdd/<name>/model.yaml
```

抽出テーブルの判定はAIが行い、誤りはユーザーが指摘する（ユーザーによる軽微な補正で十分）。

### 2. archiveのmerge順序はspec優先

```bash
modscape merge sdd/<name>/model.yaml HR.yaml --output HR.yaml
```

spec側を先に置くことでfirst-winsの挙動がspec優先になる。既存の変更ロジックを変えずに済む。

### 3. mergeの重複警告は1行追加のみ

```javascript
// 現状（サイレント）
if (!seenTableIds.has(table.id)) { ... }

// 変更後（警告追加）
if (!seenTableIds.has(table.id)) { ... }
else { console.warn(`  ⚠ ${table.id}: also exists in a later file — using first version`); }
```

ブロックせず、警告のみ。ユーザーが気づいて手動対応できる。

### 4. implementの参照先変更

現状: `modscape dev model.yaml` / model.yaml参照
変更後: `modscape dev sdd/<name>/model.yaml` / sdd/<name>/model.yaml参照

作業中は絞り込まれたビューで集中できる。全体確認は `modscape dev HR.yaml`。

## Risks / Trade-offs

- **extractの精度**: AIがData Sourcesから判断するため、spec.mdの記述が不完全だと関連テーブルが漏れる。ユーザーが補正前提。
- **archiveのHR.yaml上書き**: `--output HR.yaml` はHR.yamlを直接上書きする。gitでの差分確認が重要。mergeコマンドはgitの安全網に依存する。
- **レアな競合ケース**: 2つのspecが同じテーブルを並行修正した場合、先にarchiveした変更が後のarchiveで上書きされる。警告で検出可能だが手動対応が必要。
