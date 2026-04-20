# Q&A: dim_customers

## Q1: 同一人物が複数アカウントを持つケースはあるか？
ある。メールアドレスが異なれば別顧客として登録される。名寄せは現状未対応で、`customer_id` は一意だが同一人物を指す場合がある。

## Q2: `customer_segment` の定義は？
RFM分析に基づく5段階分類（Champions / Loyal / At Risk / Hibernating / Lost）。詳細な計算ロジックはマーケティング部門のノートブックを参照。
