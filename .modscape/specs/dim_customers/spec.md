# dim_customers

## Grain
1行 = 1顧客（現在有効なレコード）。SCD Type2 で履歴管理。

## ビジネスルール
- `is_current = true` のレコードのみを通常クエリで使用する
- 退会済み顧客は削除せず `is_active = false` で管理する
- `customer_segment` はマーケティング部門が四半期ごとに再計算して更新する

## 注意点
- 法人顧客と個人顧客が混在している。`customer_type` カラムで区別すること
