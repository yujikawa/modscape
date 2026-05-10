# dim_products

## Overview
- **Owner**: catalog-team
- **Update Frequency**: Daily (翌日 03:00 JST)
- **SLA**: —

## Business Context
商品カタログのディメンションテーブル。`hub_product` と `sat_product_details` を結合して生成される。SKU ベースで管理され、商品名・カテゴリ・ブランド・仕入れ単価を保持する。

## Business Rules
- `product_key` はサロゲートキー（連番）
- `product_id` は外部システムの SKU コード（ビジネスキー）
- `unit_cost` は最新の仕入れ単価（履歴は sat_product_details で管理）
- `category` は3階層カテゴリの第1階層のみ保持（詳細は別途 dim_product_category を参照）

## Known Issues / Caveats
- バンドル商品（複数 SKU の組み合わせ）は親 SKU のみがここに存在する
- `unit_cost` が NULL の場合は仕入れ情報未登録（主に自社開発商品）

## Changelog
- 2026-05-10: Initial version (SDD: retail-analytics-v1)
