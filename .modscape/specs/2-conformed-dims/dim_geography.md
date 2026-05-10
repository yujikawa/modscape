# dim_geography

## Overview
- **Owner**: data-platform
- **Update Frequency**: Quarterly
- **SLA**: —

## Business Context
国 → 地域 → 都市の階層を持つコンフォームド地理ディメンション。`mart_daily_revenue` の country_code と JOIN して地域別集計に使用する。全ファクトテーブルで共有される。

## Business Rules
- `country_code` は ISO 3166-1 alpha-2 形式（例: JP, US, GB）
- `geo_key` はサロゲートキー
- `region` は社内定義の販売地域（APAC / EMEA / AMER）
- 同一 `country_code` に複数 `city` が存在するため、都市レベルの分析には `geo_key` で JOIN すること

## Known Issues / Caveats
- 一部の country_code は `city` が NULL（主要都市データのみ登録済み）

## Changelog
- 2026-05-10: Initial version (SDD: conformed-dims-v1)
