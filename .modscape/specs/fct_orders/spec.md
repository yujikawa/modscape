# fct_orders

## Grain
1行 = 1注文明細。同一注文でも商品ごとに行が分かれる。

## ビジネスルール
- キャンセル済み注文（status = 'cancelled'）は集計から除外する
- 返品処理は別テーブル `fct_returns` で管理し、このテーブルでは扱わない
- `order_date` はユーザーが注文確定した日時（決済完了日ではない）

## 依存関係
- `dim_customers` との結合は `customer_id` で行う
- `dim_products` から商品カテゴリを参照する
