## Context

SDDワークフローでは、requirementsからimplementまで各フェーズで「AIが判断できず人間の調査が必要な事項」が発生する。現状これらは会話の流れで消えてしまい追跡されない。`questions.md` を導入してQ&Aを明示的に管理し、archive時に `.modscape/specs/questions.md` へ永続化する。

## Goals / Non-Goals

**Goals:**
- 各フェーズでAIが `questions.md` に調査必要事項を随時追記する
- ユニークID（`Q-001` 形式）による質問の識別と回答コマンドの提供
- archive時に `.modscape/specs/questions.md` へテーブル単位フラットマージ（矛盾検知付き）
- 未解決質問があっても仮定を明示してフェーズを進めることができる

**Non-Goals:**
- Q&Aのリマインダー通知
- 複数changeにまたがるQ&Aのリアルタイム同期（archive時のみ）
- UIからのQ&A操作

## Decisions

### questions.md のファイル構造

Pipeline-level（パイプライン全体にかかる質問）と Table-level（テーブル固有の質問）の2段構えとする。テーブル固有にできない質問はPipeline-levelに置く。

```markdown
# Questions: <pipeline title>

## Pipeline-level
- [ ] **Q-001** このパイプラインのSLAは？
  **仮定:** 日次6AM JST で進行（未確認）

## Table-level

### fct_orders
- [ ] **Q-002** amount は税込？税抜？
- [x] **Q-003** stg_raw_sales は本番DBに実在するか
  **A:** `raw.sales_events` と確認済み
```

### ID採番

change内でシーケンシャルに採番（`Q-001`, `Q-002`, ...）。`.modscape/specs/questions.md` にsync後はchange名をコメントとして残すが、IDは変更しない（グローバル採番はしない）。

### 質問生成のトリガー

フェーズに縛らず、AIが以下を検知したときに随時 `questions.md` に追記する：
- 要件が曖昧で仮定が必要な場合（requirements）
- カラム定義・ソーステーブル・ビジネスロジックが不明な場合（design）
- 実装中に想定外の型・レコード不在・制約違反を発見した場合（implement）

未解決質問がある状態でフェーズを進める場合、AIは一度「未解決の質問があります。進みますか？」と確認し、ユーザーが許可したら仮定を `questions.md` に記録して続行する。

### `modscape spec answer` コマンド

```bash
modscape spec answer <id> "<回答>"                    # アクティブなchangeが1つの場合
modscape spec answer <id> "<回答>" --change <name>    # 複数ある場合はフラグで明示
```

コマンドは `questions.md` の該当IDの行を `[x]` にして `**A:** <回答>` を追記する。

### archive時の `.modscape/specs/questions.md` sync

- テーブル単位でフラットにマージ（同じテーブルの質問を集約）
- 既存 `specs/questions.md` の質問と今回の `questions.md` を突き合わせ：
  - 矛盾（例：「このカラムは税抜」→「このカラムは廃止」）があればstrikethrough + コメントを付記
  - 同一内容の質問は重複追加しない（IDが異なっても本文が同一なら統合）
- change名はコメント（`<!-- <name> -->`）として残す

### `modscape spec new` での questions.md 生成

`modscape spec new <name>` 実行時に空の `questions.md` を生成する（既存の `src/index.js` の `spec new` 処理に追加）。

## Risks / Trade-offs

- [Risk] 矛盾検知の精度はAIの判断に依存 → sync時にAIが明示的にコメントを付けることで人間が確認できるようにする
- [Risk] `modscape spec answer` のID省略（change名省略）は複数アクティブchange時に誤動作 → 複数存在する場合は必ずchange名を要求する
- [Trade-off] グローバルIDを採番しないことでsync後にIDが衝突する可能性がある → change名コメントで追跡可能にする

## Open Questions

なし
