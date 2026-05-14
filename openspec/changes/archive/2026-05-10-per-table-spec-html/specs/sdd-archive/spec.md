## MODIFIED Requirements

### Requirement: SDD作業完了時に恒久テーブルspecを自動同期する
AIスキル `/modscape:spec:archive <name>` は `changes/<name>/spec.md`・`changes/<name>/design.md`・`changes/<name>/spec-model.yaml` を解析し、影響テーブルを特定して `.modscape/specs/<model-slug>/<table-id>.html`（または `.md`）を自動生成または更新しなければならない（SHALL）。また `changes/<name>/spec-model.yaml` を本番の main model.yaml にマージしなければならない（SHALL）。

**model-slug の導出規則（SHALL）:**
- 通常パス: `spec-config.yaml` の `main_yamls` に記載された各 YAML ファイルのパスから `path.parse(filePath).name` で導出する（例: `models/main-model1.yaml` → `main-model1`）
- グリーンフィールドパス: ユーザーがアーカイブ時に指定した出力パスから導出する

**output_format に応じた生成ルール（SHALL）:**
- `output_format: html`（`.modscape/modscape-spec.config.yaml` に設定）の場合: `specs/<model-slug>/<table-id>.html` を生成する
- デフォルト（未設定または `md`）の場合: `specs/<model-slug>/<table-id>.md` を生成する

**既存フォルダ構造の検出と案内（SHALL）:**
- archive 実行時に旧形式（`specs/<table-id>/spec.md` または `specs/<table-id>/spec.html`）が存在する場合、ユーザーに以下を通知する:
  ```
  ⚠ 旧フォルダ形式のspecが検出されました: specs/<table-id>/spec.md
    → 新形式の保存先: specs/<model-slug>/<table-id>.md
    手動で移動することを推奨します。
  ```
- 自動移動は行わない。

スキルはマージを実行する前に dry-run サマリーを表示し、ユーザーの確認を得てからマージを実行しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- dry-run サマリーを表示し確認を得た後、`modscape merge` でマージする
- 重複テーブルIDが検出された場合、警告を表示する（処理はブロックしない）
- Direct Impact および Downstream Impact — Implement テーブルに対してフル同期を実行する
- Downstream Impact — Context Only テーブルに対して Changelog のみ追記する
- `specs/_context.yaml` を更新する
- 同期完了後、作業フォルダを `.modscape/archives/YYYY-MM-DD-<name>/` に移動する

#### Scenario: html モード時に spec.html が正しいパスに生成される
- **WHEN** `output_format: html` 設定下で `/modscape:spec:archive foobar` を実行し、`spec-config.yaml` に `main_yamls: [models/main-model1.yaml]` が記載されている
- **THEN** `specs/main-model1/fct_orders.html` が生成される

#### Scenario: md モード（デフォルト）では spec.md が正しいパスに生成される
- **WHEN** `output_format` が未設定の状態で `/modscape:spec:archive foobar` を実行する
- **THEN** `specs/main-model1/fct_orders.md` が生成される

#### Scenario: 複数モデルのテーブルが別スラグ配下に分離される
- **WHEN** `spec-config.yaml` に `main_yamls: [model-a.yaml, model-b.yaml]` が記載され、各モデルに `fct_orders` が存在する
- **THEN** `specs/model-a/fct_orders.html` と `specs/model-b/fct_orders.html` がそれぞれ生成され、衝突しない

#### Scenario: 旧フォルダ形式のspecが存在する場合に警告が表示される
- **WHEN** `specs/fct_orders/spec.md`（旧フォルダ形式）が存在する状態で archive を実行する
- **THEN** 旧形式ファイルの検出と新形式パスへの手動移動を促す警告が表示される

#### Scenario: マージ前に dry-run サマリーを表示して確認を取る
- **WHEN** `/modscape:spec:archive <name>` を実行する
- **THEN** 「追加するテーブル / 更新するテーブル / 変更なし」のサマリーが表示され、確認が求められる

#### Scenario: ユーザーが確認を拒否した場合にマージをスキップする
- **WHEN** dry-run サマリー確認で拒否を選択する
- **THEN** マージは実行されず「Archive cancelled.」と表示して終了する
