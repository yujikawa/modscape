# Design: YAML Schema v2

## 設計方針

### 原則
1. **後方互換なし** — v1 YAMLはパーサーがエラーを出す。`modscape migrate` で変換する
2. **パーサーが変換の中心** — v1検出・v2正規化はすべて `parser.ts` に集約する
3. **CLIとUIは同じ型を使う** — `schema.ts` の型定義が唯一の真実
4. **AIルールはClaude版が正** — Gemini/Codex版はClaude版から派生

---

## 1. スキーマ型定義（`visualizer/src/types/schema.ts`）

### Table

```typescript
export interface Table {
  id: string;
  isImported?: boolean;           // runtime flag, read-only

  conceptual?: {
    name: string;                 // 概念名（旧 name）
    kind?: TableKind;             // 旧 appearance.type
    description?: string;         // 旧 conceptual.description
  };

  logical?: {
    name?: string;                // 旧 logical_name
    grain?: string[];             // 旧 implementation.grain
    scd?: {                       // 旧 appearance.scd + implementation.scd2 を統合
      type: string;               // type0〜type6
      business_key?: string[];
      valid_from?: string;
      valid_to?: string;
      current_flag?: string;
    };
  };

  physical?: {
    name?: string;                // 旧 physical_name
    schema?: string;
    strategy?: BuildStrategy;     // 旧 materialization
    update_mode?: UpdateMode;     // 旧 incremental_strategy
    merge_key?: string[];         // 旧 unique_key
    partition?: { field: string; granularity?: Granularity };  // 旧 partition_by
    cluster?: string[];           // 旧 cluster_by
    filter_key?: string;          // 旧 incremental_key
    lookback?: string;            // 旧 incremental_lookback
  };

  display?: {
    icon?: string;                // 旧 appearance.icon
    color?: string;               // 旧 appearance.color
  };

  metadata?: Record<string, unknown>;
  sampleData?: unknown[][];
  columns?: Column[];
}

type TableKind = 'fact' | 'dimension' | 'hub' | 'link' | 'satellite' | 'mart' | 'table';
type BuildStrategy = 'full' | 'incremental' | 'view' | 'ephemeral';
type UpdateMode = 'merge' | 'append' | 'delete_insert';
type Granularity = 'day' | 'month' | 'year' | 'hour';
```

### Column（フラット化）

```typescript
export interface Column {
  id: string;
  name?: string;                  // 旧 logical.name（フラット化）
  type?: string;                  // 旧 logical.type
  description?: string;           // 旧 logical.description
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isPartitionKey?: boolean;
  additivity?: 'fully' | 'semi' | 'non';
  expression?: string;

  physical?: {                    // 論理と異なる場合のみ
    name?: string;
    type?: string;
    constraints?: string[];
  };
}
```

### Domain

```typescript
export interface Domain {
  id: string;
  name: string;
  description?: string;
  members: string[];
  display?: {
    color?: string;               // 旧 color（トップレベル）
  };
}
```

### Consumer

```typescript
export interface Consumer {
  id: string;
  name: string;
  description?: string;
  url?: string;
  display?: {
    icon?: string;                // 旧 appearance.icon
    color?: string;               // 旧 appearance.color
  };
}
```

### Annotation

```typescript
export interface Annotation {
  id: string;
  text: string;
  target?: { id: string; type: AnnotationTargetType };  // 旧 targetId + targetType
  offset?: { x: number; y: number };
  display?: {
    color?: string;               // 旧 color（トップレベル）
  };
  // type (sticky/callout) は廃止
}

type AnnotationTargetType = 'table' | 'domain' | 'relationship' | 'lineage' | 'column';
```

### Schema（ルート）

```typescript
export interface Schema {
  version?: string;
  tables: Table[];
  relationships: Relationship[];
  lineage?: LineageEdge[];
  domains?: Domain[];
  consumers?: Consumer[];
  annotations?: Annotation[];
  imports?: ImportEntry[];
  layout?: Record<string, LayoutEntry>;
}

interface LayoutEntry {
  x: number;
  y: number;
  width?: number;
  height?: number;
  // parentId は廃止
}
```

---

## 2. パーサー設計（`visualizer/src/lib/parser.ts`）

### 方針

**パーサーはv2専用。v1の自動変換は行わない。**

v1 YAMLをUIで読み込んだ場合はエラーを返し、`modscape migrate` の実行を促す。
変換ロジックは `src/migrate.js` のみに持つ。パーサーをシンプルに保つ。

### バージョン検出と変換フロー

```
入力YAML
   ↓
detectVersion(raw)
   ├── version === "2.0.0" → normalizeV2(raw) → Schema
   └── version === "1.0.0" または未指定
         → エラー: "This file uses schema v1. Run: modscape migrate <path>"
```

### migrateV1toV2 の変換ルール（`src/migrate.js` に実装）

| v1フィールド | v2フィールド | 変換ロジック |
|---|---|---|
| `name` | `conceptual.name` | 移動 |
| `logical_name` | `logical.name` | 移動 |
| `physical_name` | `physical.name` | 移動（既存の `physical.name` を優先） |
| `appearance.type` | `conceptual.kind` | 移動、値はそのまま |
| `appearance.icon` | `display.icon` | 移動 |
| `appearance.color` | `display.color` | 移動 |
| `appearance.scd` | `logical.scd.type` | 移動、scd2と統合 |
| `conceptual.description` | `conceptual.description` | 移動 |
| `conceptual.tags` | `metadata.tags` | metadataへ移動 |
| `implementation.grain` | `logical.grain` | 移動 |
| `implementation.scd2` | `logical.scd.*` | `appearance.scd` と統合 |
| `implementation.materialization` | `physical.strategy` | リネーム |
| `implementation.incremental_strategy` | `physical.update_mode` | リネーム（`delete+insert` → `delete_insert`） |
| `implementation.unique_key` | `physical.merge_key` | リネーム |
| `implementation.partition_by` | `physical.partition` | リネーム、構造はそのまま |
| `implementation.cluster_by` | `physical.cluster` | リネーム |
| `implementation.incremental_key` | `physical.filter_key` | リネーム |
| `implementation.incremental_lookback` | `physical.lookback` | リネーム |
| `implementation.measures` | 廃止（消去） | column.expression への移行は手動 |
| `column.logical.*` | column トップレベル | フラット化 |
| `domains.color` | `domains.display.color` | 移動 |
| `layout.parentId` | 廃止（消去） | domains.members から導出 |
| `annotation.type` | 廃止（消去） | |
| `annotation.targetId` | `annotation.target.id` | オブジェクト化 |
| `annotation.targetType` | `annotation.target.type` | オブジェクト化 |
| `annotation.color` | `annotation.display.color` | 移動 |
| `consumers.appearance` | `consumers.display` | リネーム |

---

## 3. CLIミューテーション（`src/operations/`）

各 operation ファイルのフィールド名をv2スキーマに合わせて更新する。

### `table.js`
- `logical_name` → `logical.name`
- `physical_name` → `physical.name`
- `appearance.type` → `conceptual.kind`
- `appearance.icon` → `display.icon`
- `appearance.color` → `display.color`
- `conceptual.description` → `conceptual.description`（パス変更なし）

### `column.js`
- `logical.{name,type,description,...}` → トップレベルフラット化

### `domain.js`
- `color` → `display.color`

### `annotation.js`
- `type` 引数を廃止
- `targetId` / `targetType` 引数 → `target: { id, type }` オブジェクト
- `color` → `display.color`

### `consumer.js`
- `appearance.icon` / `appearance.color` → `display.icon` / `display.color`

---

## 4. dbtインテグレーション（`src/import-dbt.js`, `src/sync-dbt.js`）

dbtノードからYAMLを生成する部分でv2フィールド名を使う。

```js
// Before
{ logical_name: node.name, physical_name: node.alias, appearance: { type: 'table' } }

// After
{ conceptual: { name: node.name, kind: 'table' }, physical: { name: node.alias } }
```

---

## 5. ビジュアライザー（`visualizer/src/`）

### `cytoscapeElements.ts`
- `table.appearance?.type` → `table.conceptual?.kind`
- `table.appearance?.color` → `table.display?.color`
- `table.appearance?.icon` → `table.display?.icon`
- ドメインの `domain.color` → `domain.display?.color`
- アノテーションの `annotation.targetId` → `annotation.target?.id`

### `TableCard.tsx`
- `appearance.type` → `conceptual.kind`
- `appearance.icon` / `appearance.color` → `display.icon` / `display.color`
- `logical_name` → `logical?.name`
- `physical_name` → `physical?.name`

### `ConsumerCard.tsx`
- `appearance.icon` / `appearance.color` → `display.icon` / `display.color`

### `DetailPanel.tsx`
- タブ構成を v2 構造に合わせて再設計
  - 旧: `conceptual | logical | physical | implementation | sample | metadata`
  - 新: `conceptual | logical | physical | sample | metadata`
- 各タブのフィールドをv2構造で表示・編集できるよう更新
- `implementation` タブを廃止し、`physical` タブに統合
- `appearance.*` → 各v2フィールドへ

### `useStore.ts`（Zustandストア）
- テーブル更新系のアクションで扱うフィールド名をv2に合わせる
- `updateTable` / `updateConsumer` / `updateAnnotation` の引数型をv2型に更新

### `colors.ts`
- `appearance.type` → `conceptual.kind` で色引き引きしている箇所を更新

---

## 6. マイグレーションコマンド（新規: `src/migrate.js`）

```bash
modscape migrate <path>           # 最新スキーマまで自動アップグレード
modscape migrate <path> --dry-run # 変換内容をプレビュー
modscape migrate <path> --out <output>  # 別ファイルに出力
```

### 設計：バージョンチェーン方式

将来の v2→v3 等にも対応できるよう、マイグレーションをチェーンとして設計する。

```js
// src/migrate.js

const MIGRATIONS = [
  { from: '1.0.0', to: '2.0.0', migrate: migrateV1toV2 },
  // 将来: { from: '2.0.0', to: '3.0.0', migrate: migrateV2toV3 },
];

function migrateToLatest(yaml) {
  let current = yaml;
  let version = detectVersion(current);  // "1.0.0" または未指定

  for (const step of MIGRATIONS) {
    if (normalizeVersion(version) === step.from) {
      current = step.migrate(current);
      version = step.to;
    }
  }
  return current;
}
```

任意のバージョンから最新まで自動的にチェーンする。v1ファイルがあれば v1→v2→v3→... と順番に適用される。

### 動作フロー
1. YAMLを読み込んでバージョンを確認
2. `migrateToLatest()` でチェーンを実行
3. `--dry-run` の場合はdiffを出力して終了
4. `<path>.bak` にオリジナルをバックアップ
5. 変換後YAMLを書き出す

---

## 7. バリデーション（`src/validate.js`）

- v1フィールド（`appearance`、`implementation`、`logical_name`等）が残っていたら警告を出す
- v2の必須構造をチェック

---

## 8. AIルール・スキル

### 更新ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/templates/rules.md` | YAMLスキーマの全セクションをv2に書き直す。Quick Referenceも更新 |
| `src/templates/claude/spec/implement.md` | `implementation.*` → `physical.*`、`appearance.*` → `conceptual.*` / `display.*` |
| `src/templates/claude/spec/design.md` | フィールド参照をv2に更新 |
| `src/templates/claude/codegen.md` | コード生成ヒントのフィールド参照をv2に更新 |
| `src/templates/claude/modeling.md` | フィールド参照をv2に更新 |
| `src/templates/gemini/modscape-*/SKILL.md` | Claude版から派生してv2に更新 |
| `src/templates/codex/modscape-*/SKILL.md` | Claude版から派生してv2に更新 |
| `src/templates/codegen-rules.md` | フィールド参照をv2に更新 |
| `src/templates/default-model.yaml` | v2スキーマのサンプルYAMLに更新 |

### `rules.md` の主な変更箇所
- Quick Reference の `parentId` ルールを削除
- Section 2（Tables）を v2 構造で全面書き直し
- Section 3（Columns）をフラット化に対応して書き直し
- Section 6（Annotations）の `type` フィールドを削除
- Section 9（Consumers）の `appearance` → `display` に更新
- Section 13（CLI Flag Reference）を v2 フラグ名に更新

---

## 9. サンプルファイル（`samples/`）

- `samples/1-retail-analytics.yaml` → v2に変換
- `samples/2-conformed-dims.yaml` → v2に変換
- `samples/sdd-sample/` 配下のYAML → v2に変換

---

## 10. ドキュメント

| ファイル | 変更内容 |
|---|---|
| `CLAUDE.md` | YAML Model Format セクションをv2に全面更新 |
| `README.md` | YAML構造リファレンスセクションをv2に更新 |
| `README.ja.md` | 同上（日本語版） |
| `CHANGELOG.md` | v3.0.0エントリ追加（破壊的変更の詳細） |
| `src/model-format-version.js` | `MODEL_FORMAT_VERSION = '2.0.0'` にバンプ |

---

## 11. テスト

- `npm run build-ui` で Vite ビルドが通ること
- `npm run test:e2e` を実行し、スナップショット更新が必要なものは `npm run test:update`
- `modscape migrate` コマンドのCLIテスト（v1サンプルを変換して正しいv2が生成されることを確認）

---

## 実装順序

```
1. schema.ts（型定義）        ← 全体の基準になる
2. parser.ts（v1→v2変換含む）← UIとCLI両方が依存
3. migrate.js（移行コマンド） ← parser.ts の migrateV1toV2 を使う
4. operations/*.js（CLI）     ← schema.ts に依存
5. import-dbt.js / sync-dbt.js
6. visualizer コンポーネント  ← schema.ts + parser.ts に依存
7. validate.js
8. samples/*.yaml             ← migrate コマンドで変換
9. rules.md（Claude版）       ← Claude版が正
10. claude/spec/*.md          ← Claude版が正
11. gemini/*.md / codex/*.md  ← Claude版から派生
12. CLAUDE.md / README        ← ドキュメント最後
13. model-format-version.js   ← バンプ
14. build-ui + test:update    ← 最終確認
```
