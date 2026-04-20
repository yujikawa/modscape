## Context

現在の`_context.yaml`はarchive時にのみ更新され、`tables.*`（last_change, has_spec, open_questions数値）というスキーマ情報に隣接したメタデータを保持している。一方、per-tableの暗黙知（spec.md, questions.md）は`.modscape/specs/<table-id>/`に分散している。graph viewのDecisionsTab/DetailPanelのDecisionsタブがこれらを表示しているが、graph viewにノイズが増えている。

暗黙知の置き場が整理されていないため、「どこを見ればよいか」が不明確。またAIエージェントがコンテキストとして使う場合の統合インターフェースも存在しない。

## Goals / Non-Goals

**Goals:**
- `_context.yaml`をプロジェクト横断の暗黙知（decisions + questions）のみに絞る
- `spec new`時に`_context.yaml`の空テンプレートを自動生成する
- `modscape context export`コマンドで全暗黙知を集約・出力する
- `context.html`でknowledge pageを独立したHTMLとして提供する（build/dev対応）
- graph viewからContextに関連する表示要素を削除してすっきりさせる

**Non-Goals:**
- per-tableのspec.md/questions.mdの構造変更
- graph viewとknowledge pageの相互ナビゲーション
- `_context.yaml`のリアルタイム編集UI

## Decisions

### 1. `_context.yaml`のスキーマ

**決定**: `tables.*`セクションを廃止し、`decisions`と`questions`のみ保持する。

```yaml
decisions:
  - id: D-001
    summary: "..."
    rationale: "..."   # optional
    date: YYYY-MM-DD
    change: <change-name>

questions:
  - id: Q-001
    question: "..."
    answer: "..."      # answerがあれば回答済み、なければ未回答
    date: YYYY-MM-DD
    change: <change-name>
```

**理由**: `tables.*`のメタデータはgraph viewフィルタリング用だったが、knowledge pageに移すため不要。`affects`フィールドも同様に削除。スキーマ情報（テーブルの存在、カラム定義）はmodel.yamlが持つため二重管理を排除。

**却下した案**: `affects: [table-ids]`を残す → knowledge page側でspec.mdを直接読むため不要。

---

### 2. `modscape context export`の出力形式

**決定**: `--format json`（デフォルト）と`--format md`をサポート。

```
.modscape/specs/
├── _context.yaml
└── <table-id>/
    ├── spec.md
    └── questions.md
```

を集約して出力する。JSON形式はAI SDK向け、MD形式はLLMプロンプトへの埋め込み向け。

```bash
modscape context export [.modscape/specs/] [--format json|md]
```

**理由**: AIエージェントがコンテキストとして使う主要ユースケースはJSON（構造化）とMD（プロンプト埋め込み）の2パターン。

---

### 3. knowledge pageのビルド方式

**決定**: Viteのマルチエントリーポイントで`context.html`を追加ビルド。

```
visualizer/
├── index.html         → graph view (既存)
├── context.html       → knowledge page (新規)
└── src/
    ├── main.tsx       → graph view entry (既存)
    └── context-main.tsx → knowledge page entry (新規)
```

`modscape build`時に両方をビルドし`visualizer-dist/`に出力。`modscape dev`では`/context.html`でアクセス可能。

**理由**: 同一Viteプロジェクト内でエントリーを追加するのが最もシンプル。別リポジトリや別ビルドプロセスは管理コストが高い。

**却下した案**: React Routerでルーティング → SPAにすると`context.html`への直接URLアクセスが複雑になる。静的な別エントリーが適切。

---

### 4. graph viewからのcontext表示削除

**決定**: 以下を削除する。
- `RightPanel/DecisionsTab.tsx`（コンポーネント削除）
- `DetailPanel.tsx`の`decisions`タブ（`relatedDecisions`ロジック含む）
- `DetailPanel.tsx`の❓バッジ（`open_questions`表示）
- `useStore.ts`の`contextData`読み込みロジック
- `types/schema.ts`の`ContextYaml`, `ContextTableEntry`, `ContextDecision`型

**理由**: knowledge pageに統合するため、graph viewでの表示は不要かつノイズ。

---

### 5. `spec new`での`_context.yaml`自動生成

**決定**: `modscape spec new <name>`実行時、`.modscape/specs/_context.yaml`が存在しない場合のみ空テンプレートを生成する。

```yaml
# .modscape/specs/_context.yaml
# Cross-project tacit knowledge from SDD interactions.
# Do NOT store schema info here — that belongs in model.yaml.
# Per-table knowledge belongs in specs/<table-id>/spec.md and questions.md.

decisions: []

questions: []
```

**理由**: 初回`spec new`時に自然に生成されることで、ユーザーが手動で作る必要がなくなる。既存ファイルがあれば上書きしない。

## Risks / Trade-offs

- **既存`_context.yaml`との互換性**: 現在の`tables.*`フィールドを持つ`_context.yaml`は、archive.mdスキルが更新されるまで古い形式で書き込みが続く。archive.mdのStep 5を同時に更新する必要がある。
  → 対処: archive.mdの`_context.yaml`更新ロジックをこのchangeで同時に修正する。

- **UIの`contextData`削除**: graph viewからcontextData読み込みを削除すると、既存の`.modscape/specs/_context.yaml`を参照していたユーザーはgraph view上でDecisionsが見えなくなる。
  → 対処: knowledge pageで代替できることをCHANGELOG/READMEで明示する。

- **`context export`のspecs検索パス**: `.modscape/specs/`が存在しない場合のハンドリングが必要。
  → 対処: ディレクトリが存在しない場合は空の結果を返しエラーにしない。
