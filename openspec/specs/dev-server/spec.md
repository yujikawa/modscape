## ADDED Requirements

### Requirement: YAML File Watching
The dev server SHALL watch the specified YAML file for changes and notify the visualizer via WebSocket.

#### Scenario: YAML file is edited externally
- **WHEN** the user saves changes to the YAML file in an external editor
- **THEN** the dev server broadcasts an update message to all connected WebSocket clients

### Requirement: Layout Update API
The dev server SHALL provide an API endpoint to receive and persist layout changes.

#### Scenario: Visualizer sends new coordinates
- **WHEN** the dev server receives a `POST /api/layout` request with node coordinates
- **THEN** it updates the corresponding `layout` section in the local YAML file

### Requirement: /api/context/tables が spec.md をフラットスキャンして返す
`GET /api/context/tables` エンドポイントはモデルスラグをクエリパラメータ `?model=<slug>` で受け取り、`specs/<slug>/` 配下の `.md` ファイルをスキャンしなければならない（SHALL）。各テーブルに対し `<table-id>.md` が存在する場合は `{ spec: <md文字列> }` を返さなければならない（SHALL）。HTML spec ファイル（`.html`）はスキャン対象外とする（SHALL）。`model` クエリパラメータが未指定の場合は `specs/` 直下をスキャンし、従来の動作を維持しなければならない（SHALL）。

#### Scenario: spec.md が存在するテーブルの情報を取得する
- **WHEN** `GET /api/context/tables?model=main-model1` を呼び出し、`specs/main-model1/fct_orders.md` が存在する
- **THEN** レスポンスに `{ fct_orders: { spec: "# fct_orders\n..." } }` が含まれる

#### Scenario: spec.md が存在しないテーブルはレスポンスに含まれない
- **WHEN** `GET /api/context/tables?model=main-model1` を呼び出し、対象テーブルの `.md` ファイルが存在しない
- **THEN** そのテーブルのエントリはレスポンスに含まれない
