## ADDED Requirements

### Requirement: /api/context/tables が spec.html/spec.md をフラットスキャンし specIsHtml フラグを返す
`GET /api/context/tables` エンドポイントはモデルスラグをクエリパラメータ `?model=<slug>` で受け取り、`specs/<slug>/` 配下のファイルをスキャンしなければならない（SHALL）。各テーブルに対し `<table-id>.html` が存在する場合は `{ spec: <html文字列>, specIsHtml: true }` を、`<table-id>.md` のみ存在する場合は `{ spec: <md文字列>, specIsHtml: false }` を返さなければならない（SHALL）。`<table-id>.html` が優先される（SHALL）。`model` クエリパラメータが未指定の場合は `specs/` 直下をスキャンし、従来の動作を維持しなければならない（SHALL）。

#### Scenario: spec.html が存在するテーブルの情報を取得する
- **WHEN** `GET /api/context/tables?model=main-model1` を呼び出し、`specs/main-model1/fct_orders.html` が存在する
- **THEN** レスポンスに `{ fct_orders: { spec: "<html>...</html>", specIsHtml: true } }` が含まれる

#### Scenario: spec.md のみ存在するテーブルの情報を取得する
- **WHEN** `GET /api/context/tables?model=main-model1` を呼び出し、`fct_orders.html` が存在せず `fct_orders.md` のみ存在する
- **THEN** レスポンスに `{ fct_orders: { spec: "# fct_orders\n...", specIsHtml: false } }` が含まれる

#### Scenario: spec.html と spec.md が混在する場合は spec.html が優先される
- **WHEN** `fct_orders.html` と `fct_orders.md` の両方が存在する
- **THEN** `fct_orders.html` の内容が返され、`specIsHtml: true` となる

### Requirement: /api/table-spec/:modelSlug/:tableId エンドポイントを追加する
`GET /api/table-spec/:modelSlug/:tableId` は `specs/<modelSlug>/<tableId>.html` の内容を `text/html` で配信しなければならない（SHALL）。`?theme=light` クエリパラメータが指定された場合は LIGHT_MODE_CSS を注入して返さなければならない（SHALL）。ファイルが存在しない場合は 404 を返さなければならない（SHALL）。

#### Scenario: spec.html を取得する
- **WHEN** `GET /api/table-spec/main-model1/fct_orders` を呼び出す
- **THEN** `specs/main-model1/fct_orders.html` の内容が `text/html` で返される

#### Scenario: ライトモードで spec.html を取得する
- **WHEN** `GET /api/table-spec/main-model1/fct_orders?theme=light` を呼び出す
- **THEN** LIGHT_MODE_CSS が注入された HTML が返される

#### Scenario: 存在しない spec を取得する
- **WHEN** 対応する `.html` ファイルが存在しないパスに対してリクエストする
- **THEN** 404 が返される
