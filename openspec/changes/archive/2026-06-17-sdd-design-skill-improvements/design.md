## Context

SDDワークフローの `design` スキルは「1回の実行で1テーブルを設計する」モデルを採用しているが、実行後に他のテーブルへの案内がなく、ユーザーが「もう終わった」と誤解しやすい状態だった。また `spec dev` のDesignタブは、テーブル設計書を横スクロールタブで切り替える実装になっており、テーブル数が増えるとナビゲーションが機能不全になる。

変更対象は以下の3レイヤーにまたがる：
- スキル定義ファイル（claude / gemini / codex 各テンプレート）
- フォーマットテンプレートファイル（`.modscape/formats/`）
- UIコンポーネント（`visualizer/src/components/SpecPanel.tsx`）

## Goals / Non-Goals

**Goals:**
- 初回 `design` スキル実行時に、全影響テーブルのスタブ `design/<table-id>.md` を一括生成する
- `design.md` に `## Design Progress` セクションを追加し、進捗の source of truth とする
- Case B のテーブル選択ロジックを「ファイル存在チェック」から「進捗テーブルの ⏳ Pending 参照」に切り替える
- 会話でテーブルの追加・削除ができる旨を明示する
- Next Step の誤案内（`implement` → `tasks`）を修正する
- `spec dev` のDesignタブサブナビをサイドバーリストに変更する

**Non-Goals:**
- SDDワークフロー全体のフロー変更（requirements / tasks / implement スキルは対象外）
- `design/<table-id>.md` の自動マージ・差分検出
- スタブと本設計書のファイルフォーマット分離（同一フォーマットを流用する）

## Decisions

### 決定1: 進捗管理の source of truth を `design.md` の Progress テーブルとする

**理由:** スタブファイルを全テーブル分先に生成すると「ファイルが存在する = 設計済み」という既存ロジックが壊れる。進捗テーブルで `⏳ Pending` / `✅ Designed` を管理することで、ファイル存在とは独立して状態を追跡できる。

**代替案:** スタブファイルに frontmatter フラグ（`status: stub`）を付与する案も検討したが、スキルが frontmatter を読み取る処理を追加する必要があり複雑になるため不採用。

```markdown
## Design Progress

| Table | Type | Status |
|-------|------|--------|
| `fct_orders` | Direct Impact | ✅ Designed |
| `dim_customers` | Direct Impact | ⏳ Pending |
| `mart_revenue` | Downstream — Implement | ⏳ Pending |
```

### 決定2: スタブには既知情報をあらかじめ入力する

スタブ生成時に `modscape table get` で取得できるテーブル名・カラム一覧を事前入力する。実装詳細（Expression / Filter / Validation SQL / Test pattern）はTBDで残す。ヘッダーに `⏳ Pending design` バナーを追加して未設計であることを明示する。

**スタブフォーマット例:**

```markdown
# `dim_customers`

> ⏳ **Pending design** — run `/modscape:spec:design <name>` to detail this table.

## Table Overview

- **Type:** Direct Impact
- **Kind:** dimension

## Columns

| Column | Type | FK? | Notes |
|--------|------|-----|-------|
| customer_id | STRING | | |
| name | STRING | | |

## Implementation Details

- **Expression**: TBD
- **Filter condition**: TBD
- **Validation SQL**: TBD
- **Test pattern**: TBD
```

### 決定3: UIサイドバーはDesignタブアクティブ時のみ表示、幅は150px固定

`SpecPanel.tsx` のコンテンツエリアを `flex row` に変更し、左150pxをサイドバー、残りをiframe表示領域とする。Designタブ以外は現状の全幅iframe表示を維持する。

```
┌─────────────────────────────────────────┐
│ Tab bar (spec, design, tasks...)        │
├───────────────┬─────────────────────────┤
│ Overview      │                         │
│ ─────────     │  iframe (design/<id>)   │
│ fct_orders    │                         │
│ dim_customers │                         │
│               │                         │
└───────────────┴─────────────────────────┘
    150px固定         残り幅
```

### 決定4: 3エージェント（claude / gemini / codex）のスキルファイルを同期して更新する

設計ロジックは3ファイル（`src/templates/claude/spec/design.md`、`src/templates/gemini/modscape-spec-design/SKILL.md`、`src/templates/codex/modscape-spec-design/SKILL.md`）に重複している。今回は3ファイルすべてに同じ変更を加える。将来的な共通化は別チェンジで検討。

### 決定5: `design-table-format.md` にスタブセクションを追記する

現在のフォーマットテンプレートにスタブ用の Pending バナーと Columns セクションを追加する。既存の `## Implementation Details` セクションはそのまま維持する。また `design-table-format.md` は現在 `modscape init --sdd` でインストールされていない（`template-files.js` の formatWriteFn 呼び出しリストに含まれていない）ため、この機会に追加する。

## Risks / Trade-offs

- **[リスク] 既存の `design.md` との後方互換性** → 既存の `design.md` に `## Design Progress` セクションがない場合、Case B のロジックがフォールバックとして「ファイル存在チェック」に切り替わるよう明示する。スキル定義のステップ4に記述する。
- **[リスク] スタブファイル生成のコスト** → テーブル数が多い場合、`modscape table get` を全件実行する必要がある。現状は許容範囲だが、テーブルが50件以上ある場合は生成に時間がかかる可能性がある。今回は対策しない。
- **[トレードオフ] 3ファイル同期コスト** → 同じロジックが3箇所に存在するため、修正漏れのリスクがある。今回は手動同期で対応し、将来的な共通化は別チェンジとする。
