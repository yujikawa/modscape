## Context

`/modscape:spec:design` と `/modscape:spec:implement` は現在、1回の呼び出しで全テーブルを処理する設計になっている。テーブルが増えるほど会話履歴が累積し、トークン消費が線形に増加する。また `design.md` には全テーブルの Implementation Details が1ファイルに集約されるため、implement が1テーブルを処理する際も他テーブルの詳細を全て読み込む無駄が生じている。

## Goals / Non-Goals

**Goals:**
- 1回の `design` / `implement` 呼び出しで処理するのを1テーブルに限定し、コンテキスト累積を抑制する
- `design.md` をテーブル非依存の情報に絞り、テーブル固有の実装詳細を `design/<table-id>.md` に分離する
- `tasks` コマンドが `design.md` を全文読まずに Context Only スキップリストを取得できるようにする

**Non-Goals:**
- Claude 固有の Prompt Caching など特定AIのAPI機能への依存
- requirements / archive / answer などの他コマンドのトークン最適化（この変更のスコープ外）
- UX の大幅な変更（コマンド名・引数の変更など）

## Decisions

### 決定1: 1テーブル=1呼び出しモード

**選択**: design / implement を「次の未処理テーブルを1つだけ処理して終了」する動作に変更する。

**理由**: 全テーブルを1セッションで処理すると、後半のテーブルほど前半の会話履歴を全て抱えた状態で処理される。1テーブルごとに呼び出しを分けることで、各セッションが「テンプレート + 対象テーブルの詳細 + CLI数回」という最小限のコンテキストで完結する。

**代替案**: セッション中に定期的にサマリーを書き出してコンテキストを圧縮する案も検討したが、AIが「どこまで圧縮するか」を判断する必要があり、実装が複雑でエージェント依存になるリスクがある。1テーブル=1呼び出しはテンプレートの記述変更のみで実現できる。

**トレードオフ**: ユーザーはコマンドを複数回呼び出す必要があるが、進捗は `tasks.md` のチェックボックスで追跡できるため操作上の混乱は小さい。

---

### 決定2: design.md の3層分離

**選択**:
- `spec.md` — WHATとWHY（ビジネス要件・ドメイン知識）
- `design.md` — テーブル非依存のHOW（全体設計方針・影響テーブル一覧・未解決質問参照）
- `design/<table-id>.md` — テーブル依存のHOW（Expression・Filter・Validation SQL・Test pattern）

**理由**: 現在の `design.md` は `## Implementation Details` に全テーブル分のセクションが積み上がる構造で、テーブル数に比例して肥大化する。implement が1テーブルを処理する際は対象テーブルの詳細だけ読めばよいが、現状は他テーブルの詳細も全て読み込んでいる。分離後は `design.md` が常に小さいサイズに保たれ、implement は `design.md`（全体方針）+ `design/<table-id>.md`（対象テーブル分のみ）を読む。

**代替案**: design.md 内に機械読み用セクションを埋め込んでファイルを分けない案もあるが、ファイル分離の方が「必要な情報だけ読む」境界が明確になる。

---

### 決定3: tasks は design.md を全文読む（SUMMARY ブロック不要）

`tasks` コマンドが `design.md` から Context Only スキップリストを読む際、`design.md` はテーブル非依存の小さなファイルになっているため全文読みで問題ない。当初 SUMMARY ブロックを検討したが、Affected Tables と二重管理になり stale のリスクがあるため採用しない。

## Risks / Trade-offs

- **既存ワークフローとの互換性** → `design/<table-id>.md` が存在しない古いspecに対して implement が動くよう、フォールバック（`design.md` の `## Implementation Details` セクションを読む）を一定期間維持する
- **コマンド呼び出し回数の増加** → ユーザーが10テーブルのspecを実装するには implement を10回呼ぶ必要がある。tasks.md の進捗表示で現在位置を明示することで混乱を軽減する
- **Gemini テンプレートの二重管理** → claude/ と gemini/ の両テンプレートを同じ方針で更新する必要がある。共通部分が多いため、変更方針を揃えて作業する
