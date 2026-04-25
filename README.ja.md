# <img src="./visualizer/public/favicon.svg" width="32" height="32" align="center" /> Modscape

[![npm version](https://img.shields.io/npm/v/modscape.svg?style=flat-square)](https://www.npmjs.com/package/modscape)
[![npm downloads](https://img.shields.io/npm/dm/modscape.svg?style=flat-square)](https://www.npmjs.com/package/modscape)
[![Deploy Demo](https://github.com/yujikawa/modscape/actions/workflows/deploy.yml/badge.svg)](https://github.com/yujikawa/modscape/actions/workflows/deploy.yml)
[![Publish to NPM](https://github.com/yujikawa/modscape/actions/workflows/publish.yml/badge.svg)](https://github.com/yujikawa/modscape/actions/workflows/publish.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Modscape** は、モダンなデータ基盤（Modern Data Stack）に特化した、YAML駆動のデータモデリング・ビジュアライザーです。物理的なスキーマとビジネスロジックのギャップを埋め、データチームがデータを通じた「ストーリー」を設計、文書化、共有することを可能にします。


🌐 **Live Demo:**
https://yujikawa.github.io/modscape/


![Modscape Screenshot](https://raw.githubusercontent.com/yujikawa/modscape/main/docs/assets/modscape.png)


## なぜ Modscape なのか？

現代のデータ分析基盤において、データモデリングは単に図を描くだけの作業ではありません。バージョン管理が可能で、AIと親和性が高く、エンジニアとステークホルダーの双方が理解できる **「信頼できる唯一の情報源（SSOT）」** を維持することが不可欠です。

- **データエンジニア向け**: 物理テーブルと論理エンティティの明確なマッピングを維持。複雑な **Data Vault** や **スター・スキーマ** を視覚化。
- **アナリティクスエンジニア向け**: dbt などのツールに適した、モジュール性の高いモデルを設計。SQLを書く前に、データの粒度（Grain）や主キー、リレーションを定義。
- **データサイエンティスト向け**: **サンプルデータ「ストーリー」** によるデータ探索。クエリを叩くことなく、統合されたサンプルプレビューからテーブルの目的と内容を把握。

## 主な機能

- **YAML-as-Code**: データアーキテクチャ全体を単一のYAMLファイルで定義。Gitによる変更管理が可能。
- **3階層ネーミングシステム**: エンティティを **概念名**（ビジュアル）、**論理名**（ビジネス定義）、**物理名**（実際のテーブル名）の3段階でドキュメント化。
- **自動レイアウト調整**: インテリジェントな階層型レイアウトエンジンにより、リレーションに基づいてテーブルとドメインを自動的に整列（※モデルの複雑さによっては手動での微調整が必要な場合があります）。
- **刷新されたモデリング・ノード**: 左上に突き出した「インデックス・タブ」で種類（FACT, DIM, HUB等）を明示。長い物理名は自動省略され、プロフェッショナルな外観を維持。
- **インタラクティブなビジュアルキャンバス**: 
  - **ドラッグで接続**: カラム間のリレーションを直感的に作成。吸着機能で快適な操作感。
  - **意味的なエッジバッジ**: 接続点に `( 1 )` や `[ N ]` バッジを表示し、カーディナリティ（多重度）を視覚化。
  - **データリネージ・モード**: データの流れをアニメーション付きの点線矢印で可視化。
  - **ドメイン階層ナビゲーション**: テーブルをビジネスドメインごとに整理し、構造化されたサイドバーから素早くアクセス。
- **統合 Undo/Redo & オートセーブ**:
  - キャンバス上の操作（追加・削除・移動など）をグラフレベルで Undo/Redo（`Ctrl+Z` / `Ctrl+Shift+Z`）可能。
  - オートセーブにより、ローカルのYAMLを常に最新の状態に維持。
- **YAMLサイドバー**: 読み取り専用のYAMLビューアに **Diff トグル**（最後のディスク読み込みからの差分をハイライト）と **ダウンロードボタン**（現在のモデルをYAMLファイルとしてエクスポート）を搭載。YAMLを直接編集したい場合は、外部エディタ（VS Codeなど）でファイルを開いてください。変更は自動的に同期されます。
- **詳細パネル（Detail Panel）**: テーブル・カラムのメタデータをUI上で直接編集可能。IDのリネーム（関連参照を一括更新）、外観アイコン・カラーの設定、カラムロールトグル（`isPrimaryKey`・`isForeignKey`・`isPartitionKey`）に対応。
- **ダーク/ライトモード対応**: 利用環境やドキュメント作成の用途に合わせて、ワンクリックでテーマを切り替え可能。
- **データ分析特化のモデリング**: `fact`, `dimension`, `mart`, `hub`, `link`, `satellite` に加え、汎用的な `table` タイプを標準サポート。
- **AIエージェント対応**: **Gemini CLI, Claude Code, Codex** 用の雛形を内蔵。モデリング（`/modscape:modeling`）と実装コード生成（`/modscape:codegen`）の両方でLLMを活用できます。

## インストール

```bash
npm install -g modscape
```

---

## はじめに

### A: AI駆動のモデリング（推奨）
1.  **初期化**: 使用するAIエージェントに合わせてルールファイルとコマンドを生成します。
    ```bash
    modscape init --gemini   # Gemini CLI
    modscape init --claude   # Claude Code
    modscape init --codex    # Codex
    modscape init --all      # 3つすべて
    ```
    `.modscape/rules.md`（YAMLスキーマのルール）と `.modscape/codegen-rules.md`（実装コード生成のルール）、および各エージェント用のコマンドファイルが生成されます。

    > **ルールの更新**: Modscape をアップグレードした後は、`modscape init` を再実行することで `.modscape/rules.md` と `.modscape/codegen-rules.md` を最新版に上書きできます。

2.  **起動**: ビジュアライザーを起動します。
    ```bash
    modscape dev model.yaml
    ```

3.  **データモデルの設計** — `/modscape:modeling` でモデルを作成・編集します。
    > *".modscape/rules.md のルールに従って、model.yaml に新しい 'Marketing' ドメインを追加して。"*

4.  **実装コードの生成** — `/modscape:codegen` でYAMLをdbt / SQLMesh / Spark SQLに変換します。
    > *".modscape/codegen-rules.md に従って、model.yaml からdbtモデルを生成して。"*

    エージェントは `lineage` セクションを元に依存関係の順でモデルを生成し、YAMLで定義しきれない箇所には `-- TODO:` コメントを残します。

### B: 手動モデリング
アーキテクチャを直接コントロールしたい場合に最適です。

1.  **YAML作成**: `model.yaml` ファイルを作成します（[YAMLリファレンス](#モデルの定義-yaml) を参照）。
2.  **起動**: ビジュアライザーを起動します。
    ```bash
    modscape dev model.yaml
    ```

---

## モデルの定義 (YAML)

YAMLのルートレベル構造は以下の通りです：

```
version      – モデルフォーマットのバージョン（任意の文字列、例: "1.0.0"）
imports      – 他のYAMLファイルからテーブルを参照（dev/build時に解決）
domains      – 関連テーブルをまとめるビジュアルコンテナ
tables       – 3階層メタデータを持つエンティティ定義
relationships – テーブル間のERカーディナリティ
lineage      – データの流れ / 変換パス
annotations  – キャンバス上のスティッキーノート・吹き出し
layout       – 全座標データ（tables/domains の中に x/y を書いてはいけない）
consumers    – データの下流消費者（BIダッシュボード・MLモデル・アプリケーション等）
```

### Domains（ドメイン）

```yaml
domains:
  - id: core_sales
    name: "主要売上"
    description: "営業チームのトランザクションデータ。"  # 任意
    display:
      color: "rgba(59, 130, 246, 0.1)"  # 背景色
    members: [orders, dim_customers]   # 論理的な所属リスト
```

### Tables（テーブル）

テーブルスキーマは3層オントロジーとビジュアル軸で構成されます：

```yaml
tables:
  - id: orders
    conceptual:  # ビジネス層 – AI向け
      name: 注文                         # 表示名（大、必須）
      kind: fact                         # fact | dimension | mart | hub | link | satellite | table
      description: "1行 = 1注文明細。"  # AIが読むコンテキスト
      tags: [WHO, WHAT, WHEN]           # BEAM* タグ

    logical:  # 分析層 – 任意
      name: "顧客注文履歴"               # 正式な業務名（中）
      grain: [month_key]                 # GROUP BY カラム（martのみ）
      scd:                               # ディメンション用 SCD 設定
        type: type2                      # type0〜type6
        business_key: [customer_id]      # 自然キーのカラム ID（複合キーも可）
        valid_from: valid_from           # 有効開始日のカラム ID
        valid_to: valid_to               # 有効終了日のカラム ID
        current_flag: is_current         # 任意 – 現在レコードフラグのカラム ID

    physical:  # 構築・ストレージ層 – 任意
      name: "fct_retail_sales"           # ウェアハウスのテーブル名（小）
      strategy: incremental              # table | view | incremental | ephemeral
      update_mode: merge                 # merge | append | delete_insert
      merge_key: order_id
      partition:
        field: order_date                # DATE/TIMESTAMP型カラムを指定
        granularity: day                 # day | month | year | hour
      cluster: [customer_id]
      filter_key: updated_at             # 任意 – インクリメンタルフィルターのカラム ID
      lookback: "3 days"                 # 任意 – インクリメンタルフィルターの安全マージン
      measures:                          # 集計定義（martのみ）
        - column: total_revenue
          agg: sum                       # sum | count | count_distinct | avg | min | max
          source_column: fct_sales.amount

    display:  # ビジュアル層 – 任意
      icon: "💰"
      color: "#e0f2fe"  # 任意のヘッダーカラー

    columns:
      - id: order_id
        name: "注文ID"                   # フラット構造（logical: ラッパー不要）
        type: Int                        # Int | String | Decimal | Date | Timestamp | Boolean など
        description: "サロゲートキー。"
        isPrimaryKey: true
        isForeignKey: false
        isPartitionKey: false
        additivity: fully                # fully | semi | non
        expression: "CAST(raw_amount AS DECIMAL(18,2))"  # 任意 – SELECT 句に使う SQL 式
        physical:  # 任意 – ウェアハウスの物理定義を上書き
          name: order_id
          type: "BIGINT"
          constraints: [NOT NULL]

    metadata:  # 任意 – ユーザー定義のキーバリューペア（任意の文字列キー）
      owner: data-platform
      sla: "daily 6AM JST"
      sql_path: "models/marts/fct_orders.sql"

    sampleData:  # 実数値の2次元配列
      - [1001, 50.0, "COMPLETED"]
      - [1002, 120.5, "PENDING"]
```

### Data Lineage（データリネージ）

ルートレベルの `lineage` セクションでテーブル間のデータの流れ（どのソースからどの集計テーブルが作られるか）を定義します。リネージモードではアニメーション付きの点線矢印として表示されます。

```yaml
lineage:
  - id: lin_orders_revenue   # 任意。省略時はパーサーが lin-{from}-{to} 形式で自動生成。
    from: fct_orders         # ソーステーブル ID
    to: mart_revenue         # 派生テーブル ID
    join_type: left          # 任意 – inner | left | cross | none
    description: "日次注文金額を月次バケットに集計"  # 任意。変換内容の説明。
  - id: lin_dates_revenue
    from: dim_dates
    to: mart_revenue
    join_type: inner
```

### Relationships（リレーションシップ）

```yaml
relationships:
  - id: rel_cust_orders
    from:
      table: dim_customers   # テーブル ID
      column: [customer_id]  # カラム ID（配列）
    to:
      table: fct_orders
      column: [customer_id]
    type: one-to-many  # one-to-one | one-to-many | many-to-one | many-to-many
    description: "リレーションシップの説明（任意）"  # optional
```

> **ER関係** vs **リネージ**: 構造的な結合（外部キーなど）には `relationships` を、データの加工・変換の流れには `lineage` を使用してください。両方に同じ接続を記述しないでください。

### Imports（インポート）

他のYAMLファイルで定義されたテーブルを、コピーなしで参照できます。複数のモデルにまたがる**コンフォームドディメンション**の管理に最適です。

```yaml
imports:
  - from: ./shared/conformed-dims.yaml   # このファイルからの相対パス
    ids: [dim_dates, dim_customers]      # 任意: 省略すると全テーブルをimport
```

`modscape dev` または `modscape build` 実行時に自動解決されます。importされたテーブルはキャンバス上に読み取り専用ノードとして表示されます。編集する場合はソースファイルを直接更新してください。

importされたテーブルのIDは、`domains.members`・`relationships`・`lineage` でローカルテーブルと同様に使用できます。

### Consumers（コンシューマー）

コンシューマーはデータモデルの下流消費者を表します。BIダッシュボード、MLモデル、アプリケーションなど、データを利用するあらゆるシステムを定義できます。キャンバス上に独自のノードとして表示され、リネージ矢印で接続されます。

```yaml
consumers:
  - id: revenue_dashboard       # 一意のID — lineageやlayoutで使用
    name: "Revenue Dashboard"   # 表示名
    description: "財務チーム向け月次KPIダッシュボード"  # 任意
    display:
      icon: "📊"                # 任意（デフォルト: 📊）
      color: "#e0f2fe"          # 任意のアクセントカラー
    url: "https://bi.example.com/revenue"  # 任意のリンク
```

コンシューマーへのリネージは `lineage.to` にコンシューマーIDを指定します：

```yaml
lineage:
  - from: mart_monthly_revenue
    to: revenue_dashboard   # コンシューマーID
```

テーブルと同様に、ドメインの `members` リストにも追加できます。

### Annotations（アノテーション）

```yaml
annotations:
  - id: note_001
    text: "粒度：1行 = 1注文明細"
    target:                  # 任意 – 貼り付け先
      id: fct_orders         # 貼り付け先のオブジェクト ID
      type: table            # table | domain | relationship | lineage | column
    display:
      color: "#fef9c3"       # 任意の背景色
    offset:
      x: 100    # 対象の左上からのオフセット（target 未指定時は絶対座標）
      y: -80
```

### Layout（レイアウト）

全座標データはオブジェクト ID をキーとして `layout` に記述します。**`tables` や `domains` の中に `x`/`y` を書いてはいけません。**
ドメインへの所属は `domains.members` で宣言します（`parentId` は不要）。

```yaml
layout:
  # ドメイン – width と height が必要
  core_sales:
    x: 0
    y: 0
    width: 880
    height: 480

  # ドメイン内のテーブル – 座標はドメインの原点からの相対値
  # （所属は domains.members で宣言）
  orders:
    x: 280
    y: 200

  # スタンドアロンテーブル – キャンバス絶対座標
  mart_summary:
    x: 1060
    y: 200
```

---

## 使い方

### 開発モード (インタラクティブ)
```bash
modscape dev ./models
```
- **永続化**: レイアウトやメタデータの変更は、直接ファイルに書き戻されます（オートセーブ対応）。

### 新規モデルの作成
```bash
modscape new models/sales/customer.yaml
```
- **再帰的作成**: 指定したパスの親ディレクトリが存在しない場合、自動的に作成します。
- **ボイラープレート**: ドメイン、3階層ネーミング、リレーション、リネージの例が含まれた有効なYAMLファイルを生成します。

### ビルドモード (静的サイト)
```bash
modscape build ./models -o docs-site
```

### エクスポートモード (Markdown)
```bash
modscape export ./models -o docs/ARCHITECTURE.md

# SDDコンテキスト（decisions・Q&A・glossary・テーブル別spec）を統合して出力
modscape export ./models --with-context
modscape export ./models --with-context ./path/to/specs
```

---

## dbt連携

既存のdbtプロジェクトを `manifest.json` から直接インポートできます。

### 事前準備

コマンドを実行する前に、dbtプロジェクトで `dbt parse`（または `target/manifest.json` を生成する任意のdbtコマンド）を実行してください。

### dbtプロジェクトのインポート

```bash
modscape dbt import [project-dir] [オプション]
```

| オプション | 説明 |
|-----------|------|
| `-o, --output <dir>` | 出力ディレクトリ（デフォルト: `modscape-<プロジェクト名>`） |
| `--split-by <key>` | `schema`、`tag`、`folder` のいずれかでYAMLファイルを分割 |

**使用例:**

```bash
# カレントディレクトリからインポート
modscape dbt import

# 特定のdbtプロジェクトパスを指定
modscape dbt import ./my_dbt_project

# スキーマ別にYAMLファイルを分割して出力
modscape dbt import --split-by schema

# dbtタグ別に分割し、出力先ディレクトリを指定
modscape dbt import --split-by tag -o ./modscape-models
```

インポート後は以下でビジュアライザーを起動できます：
```bash
modscape dev modscape-my_project
```

> **インポートされる内容:** `manifest.json` 内の `model`、`seed`、`snapshot`、`source` ノード（カラム、説明文、`depends_on` によるリネージ含む）。
> **分割モード:** `--split-by` 指定時はグループごとに別YAMLファイルへ出力されます。自己完結率（self-contained rate）が80%未満のファイルは、クロスファイルのリネージ参照が単体では表示されないため注意してください。

### dbt変更の同期

dbtプロジェクトを更新した後、既存のModscape YAMLファイルへ差分を反映できます。手動で追加したレイアウト・外観・アノテーション・リレーションシップは保持されます。

```bash
modscape dbt sync [project-dir] [オプション]
```

| オプション | 説明 |
|-----------|------|
| `-o, --output <dir>` | 同期対象のModscape YAMLが置かれたディレクトリ（デフォルト: `modscape-<プロジェクト名>`） |

```bash
# カレントディレクトリのdbtプロジェクトを同期
modscape dbt sync

# パスを指定して同期
modscape dbt sync ./my_dbt_project -o ./modscape-models
```

> **sync と import の違い:** `import` はYAMLをゼロから生成します。`sync` は既存ファイルを更新するため、手動で加えたテーブル種別・ビジネス定義・サンプルデータなどの情報が失われません。

---

## モデルファイル操作

### YAMLファイルのマージ

複数のYAMLモデルを1ファイルに統合します。テーブル/ドメインIDが重複した場合は先勝ちで処理されます。

```bash
modscape merge model-a.yaml model-b.yaml -o merged.yaml

# ディレクトリ内のすべてのYAMLをマージ
modscape merge ./models -o merged.yaml
```

### テーブルの抽出

特定のテーブル（関連するリレーションシップ・リネージも含む）を新しいYAMLファイルへ切り出します。

```bash
modscape extract model.yaml --tables orders,dim_customers -o subset.yaml

# 複数ファイルから抽出
modscape extract ./models --tables fct_sales,dim_dates -o extracted.yaml
```

### 自動レイアウト

テーブルのリレーションシップをもとに、座標を自動計算してYAMLに書き込みます。

```bash
modscape layout model.yaml

# 別ファイルに出力
modscape layout model.yaml -o model-with-layout.yaml
```


### バリデーション

model.yamlの構造的なエラー（参照切れ、座標の誤配置、ID重複など）を検出します。

```bash
modscape validate model.yaml

# AIエージェント向け機械可読出力
modscape validate model.yaml --json
```

---

## アトミックモデル操作コマンド

AIエージェントやスクリプトから、YAMLモデルファイルに対して精確な変更を加えるためのコマンドです。すべてのコマンドで `--json` オプションによる機械可読な出力が利用できます。

### テーブルコマンド

```bash
modscape table list <file>               # テーブルID一覧を表示
modscape table list <file> --type fact   # タイプでフィルタリング
modscape table list <file> --domain <id> # ドメインでフィルタリング
modscape table list <file> --orphan      # ドメイン未所属テーブルのみ表示
modscape table get <file> --id <id>      # 指定テーブルをJSONで取得
modscape table add <file> --data <json>  # テーブルを追加
modscape table update <file> --id <id> --data <json>  # テーブルを更新
modscape table remove <file> --id <id>  # テーブルを削除
```

### カラムコマンド

```bash
modscape column list <file> --table <id>
modscape column add <file> --table <id> --data <json>
modscape column update <file> --table <id> --id <col-id> --data <json>
modscape column remove <file> --table <id> --id <col-id>
```

### リレーションシップコマンド

```bash
modscape relationship list <file>
modscape relationship get <file> --id <id>
modscape relationship add <file> --from <ref> --to <ref> --type <type> [--id <id>] [--description <text>]
modscape relationship update <file> --id <id> [--type <type>] [--description <text>]
modscape relationship remove <file> --id <id>
```

### リネージコマンド

```bash
modscape lineage list <file> [--from <table-id>] [--recursive] [--depth <n>] [--json]
modscape lineage get <file> --id <id>
modscape lineage add <file> --from <table-id> --to <table-id> [--id <id>] [--description <text>]
modscape lineage update <file> --from <table-id> --to <table-id> [--description <text>]
modscape lineage remove <file> --id <id>
```

### ドメインコマンド

```bash
modscape domain list <file>
modscape domain get <file> --id <id>
modscape domain add <file> --data <json>
modscape domain update <file> --id <id> --data <json>
modscape domain remove <file> --id <id>
modscape domain member add <file> --domain <id> --id <member-id>
modscape domain member remove <file> --domain <id> --id <member-id>
```

### コンシューマーコマンド

```bash
modscape consumer list <file>
modscape consumer get <file> --id <id>
modscape consumer add <file> --id <id> --name <name> [--description <text>] [--icon <icon>] [--color <color>] [--url <url>]
modscape consumer update <file> --id <id> [--name <name>] [--description <text>] [--icon <icon>] [--color <color>] [--url <url>]
modscape consumer remove <file> --id <id>
```

### アノテーションコマンド

```bash
modscape annotation list <file>
modscape annotation add <file> --text <text> [--id <id>] [--type sticky|callout] [--color <color>] [--target-id <id>] [--target-type table|domain|relationship|lineage|column] [--offset-x <x>] [--offset-y <y>]
modscape annotation update <file> --id <id> [--text <text>] [--color <color>]
modscape annotation remove <file> --id <id>
```

### サマリーコマンド

```bash
modscape summary <file>        # モデルの概要を表示
modscape summary <file> --json # JSON形式で出力
```

## 仕様駆動データエンジニアリング（SDD）

SDD はパスAの上に構造化されたワークフローを追加し、ビジネス要件から実装、そして恒久的なドキュメントまで一貫して支援します。各パイプラインは名前付き作業フォルダで管理され、完了後はテーブル単位のビジネス仕様書としてアーカイブされます。

1.  **SDD付きで初期化**:
    ```bash
    modscape init --claude --sdd   # Claude Code
    modscape init --codex --sdd    # Codex
    modscape init --gemini --sdd   # Gemini CLI
    modscape init --all --sdd      # すべてのエージェント
    ```
    スキルとカスタマイズテンプレートがインストールされ、`.modscape/changes/` と `.modscape/specs/` ディレクトリが作成されます。

2.  **要件定義** — `/modscape:spec:requirements` を実行してパイプラインの仕様を対話的に定義します:
    - AIが `modscape spec new <name>` で作業フォルダを scaffold（`spec-config.yaml`・`spec-model.yaml`・`design.md`・`tasks.md`・`questions.md` を生成）
    - ゴール、ステークホルダー、データソース、受け入れ条件、ターゲットツールを収集
    - **受け入れ条件には連番 ID（`AC-001`, `AC-002`, ...）が自動付与されます**（トレーサビリティ確保）
    - main-model.yamlのパスを `modscape-spec.custom.md` から解決、またはユーザーに確認
    - 未解決の調査事項は `questions.md` に `Q-NNN` エントリとして記録
    - `.modscape/changes/<name>/spec.md` に出力

3.  **モデル設計** — `/modscape:spec:design <name>` を実行します:
    - `spec.md` をもとに関連テーブルを自動特定し、`modscape extract` でmain-model.yamlから `changes/<name>/spec-model.yaml` を生成
    - `specs/<table-id>/questions.md` から Direct Impact テーブルに関連する未解決 `Q-NNN` を `design.md` に参照挿入
    - `modscape spec search` で過去アーカイブを検索し、関連する過去 SDD を `design.md` に記録
    - どのテーブルが `main-model.yaml` に属するかを `spec-config.yaml` に記録
    - 新規テーブルを `changes/<name>/spec-model.yaml` に追加設計（`main-model.yaml` は触らない）
    - `design.md`（設計判断）と `tasks.md`（実装チェックリスト）を生成
    - **Phase 4 テストタスクに `[→ AC-NNN]` アノテーションを付与**し、手動検証が必要な AC には `[手動検証]` フラグを付ける
    - **再実行可能**: 気づきを `design.md` の `### Requires Model Change` に追記し、再実行でmodelとtasksを更新
    - 設計完了後に **Review Checkpoint**（未解決質問・仮定・ACカバレッジ）を出力

4.  **実装** — `/modscape:spec:implement <name>` を実行してタスクを順に処理し、dbt / SQLMesh のコードを生成してチェックを更新します

5.  **アーカイブ** — `/modscape:spec:archive <name>` を実行して恒久テーブル仕様書を同期します:
    - **dry-run プレビューを先に表示**: 追加・更新（変更カラム）・変更なしのテーブルを ID 単位でサマリー表示し、確認後にマージを実行
    - `spec-config.yaml` を参照し、テーブルごとに対応するmain-model.yamlにマージ
    - 影響テーブルごとに `.modscape/specs/<table-id>/spec.md` を生成・更新（旧 `specs/<table-id>.md` フラットファイルは自動マイグレーション）
    - 上流テーブルにはChangelog追記のみ
    - `questions.md` の `## Table-level` セクションをテーブルごとの `specs/<table-id>/questions.md` に同期。`## Pipeline-level` の質問は `specs/` に昇格させずarchiveフォルダに保持
    - `specs/_context.yaml` を更新（テーブルごとに `last_change`・`open_questions`・`has_spec` を書き込み、主要な設計判断を `decisions` リストに追記）
    - **アーカイブサマリーに AC カバレッジを表示**（テスト紐付き / 手動検証 / 未カバーの件数）
    - 作業フォルダは自動的に `.modscape/archives/YYYY-MM-DD-<name>/` へ移動

    恒久スペックはテーブル単位のディレクトリ構造で蓄積されます:
    ```
    .modscape/specs/
    ├── _context.yaml              ← SDD 横断メタデータ（ビジュアライザー連携）
    └── <table-id>/
        ├── spec.md                ← 業務文脈・設計決定
        └── questions.md           ← テーブル単位 Q&A 履歴
    ```

> **Tip**: `/modscape:spec:status <name>` をいつでも実行すると、現在のフェーズ・タスク進捗・次のコマンドを確認できます。

> **実装前のレビュー**: `/modscape:spec:review <name>` を実行すると go/no-go サマリーを確認できます — 未解決の質問・仮定・ACカバレッジ・分類確信度の低いテーブルを一覧表示。実装の進行はブロックしません。

> **整合性チェック**: `/modscape:spec:validate <name>` を実行すると全アーティファクト横断の整合性チェックを行えます — spec.md ↔ design.md、design.md ↔ spec-model.yaml、design.md ↔ tasks.md、questions.md ↔ design.md の矛盾・抜け・ズレをカテゴリ別に報告します。

> **実装中のトラブル対応**: `/modscape:spec:amend <name>` を実行すると、実装中に発覚した問題（カラム名の誤り・JOIN キーの相違・想定外の NULL など）を SDD 成果物に反映できます。エラーを貼り付けるか問題を自由記述で渡すと、AI が `spec.md`・`design.md`・`tasks.md`・`questions.md` を差分更新します。完了済みタスクは保持されます。

> **過去のwork検索**: `/modscape:spec:search <keyword>`（または `modscape spec search <keyword>`）を実行すると、過去のアーカイブと永続スペックを横断検索して類似の設計・実装パターンを探せます。`--limit <n>` で結果件数を指定（デフォルト: 5）、`--json` で機械可読な出力を取得できます。

> **既存PJへの導入**: `/modscape:spec:generate [files...]` を実行すると、既存の model.yaml・SQL・Python ファイルから全テーブルの `specs/<table-id>/spec.md` を一括生成できます。通常の SDD フローを開始する前に実行するベースライン整備コマンドです。既存の spec.md は上書きされません。引数を省略すると対話形式でファイルを指定できます。

> **カスタマイズ**: `.modscape/changes/modscape-spec.custom.md.example` を `modscape-spec.custom.md` にリネームすることで、ターゲットツールのデフォルト値、必須フィールド、出力規約をプロジェクトごとに上書きできます。

### SDDワークフロー

```
requirements → design → implement → archive
                 ↑↓          ↑
             (再実行)    (amend)
         → review（任意）↗
```

| スキル | コマンド | やること | 主な出力 |
|--------|---------|---------|---------|
| 一括生成 | `/modscape:spec:generate [files...]` | 既存の model.yaml・SQL・Python ファイルから `specs/<table-id>/spec.md` を一括生成 — 既存 PJ の SDD 導入時に使用 | `specs/<id>/spec.md` |
| 要件定義 | `/modscape:spec:requirements` | ゴール・AC・Q&Aを対話的に収集 | `spec.md` |
| 設計 | `/modscape:spec:design <name>` | 影響テーブルの特定、モデル・タスクリスト生成 | `design.md`, `tasks.md` |
| 実装 | `/modscape:spec:implement <name>` | タスクを順に処理・コード生成 | `tasks.md`（更新） |
| アーカイブ | `/modscape:spec:archive <name>` | 本番マージ・spec永続化 | `specs/<id>/spec.md`, `_context.yaml` |
| レビュー | `/modscape:spec:review <name>` | 実装前の go/no-go チェック（任意） | — |
| バリデート | `/modscape:spec:validate <name>` | 全アーティファクト横断の整合性チェック（任意） | — |
| 修正 | `/modscape:spec:amend <name>` | 実装中の問題を成果物に反映（任意） | — |
| 検索 | `/modscape:spec:search <keyword>` | 過去アーカイブを横断検索（任意） | — |
| 回答 | `/modscape:spec:answer <name> <id>` | Q-NNN に回答・設計影響を評価（任意） | — |
| メモ | `/modscape:spec:note [table-id]` | 会話・Slack・会議で得た知識を `specs/<table-id>/spec.md` に追記 — アクティブなワークフロー不要（任意） | — |

**例: 月次売上サマリーパイプラインを設計する場合**

```
You:  /modscape:spec:requirements
AI:   何を作りますか？
You:  月次の売上サマリーを作りたい。ソースは fct_orders と dim_customers。
AI:   受け入れ条件を確認します。AC-001: 月次集計、AC-002: 顧客セグメント別...
      → changes/monthly-sales-summary/spec.md を生成しました

You:  /modscape:spec:design monthly-sales-summary
AI:   既存の spec と過去アーカイブを確認しました。
      Direct Impact:   fct_orders（更新）, dim_customers（更新）, mart_monthly_sales（新規）
      Downstream:      mart_revenue（Context Only）
      → design.md と tasks.md を生成しました

You:  /modscape:spec:implement monthly-sales-summary
AI:   Task 1/6: mart_monthly_sales の dbt モデルを生成します...
      ...
      ✓ 6/6 タスク完了

You:  /modscape:spec:archive monthly-sales-summary
AI:   dry-run:
        追加:   mart_monthly_sales
        更新:   fct_orders（amount カラム追加）, dim_customers（segment カラム追加）
        参照:   mart_revenue（Changelog のみ）
      進めますか？
You:  y
AI:   マージ完了。以下のファイルを生成・更新しました:

      specs/
      ├── _context.yaml                       ← last_change, decisions を更新
      ├── fct_orders/
      │   ├── spec.md                         ← Business Rules を更新
      │   └── questions.md                    ← Q-001, Q-002 を同期
      ├── dim_customers/
      │   ├── spec.md                         ← Business Rules を更新
      │   └── questions.md                    ← Q-003 を同期
      ├── mart_monthly_sales/
      │   ├── spec.md                         ← 新規生成
      │   └── questions.md                    ← 新規生成
      └── mart_revenue/
          └── spec.md                         ← Changelog エントリを追記
```

## クレジット

Modscape は以下の素晴らしいオープンソースプロジェクトによって支えられています：

- [CodeMirror 6](https://codemirror.net/) - 次世代のウェブベース・コードエディタ。
- [Dagre](https://github.com/dagrejs/dagre) - 階層型グラフ・レイアウトエンジン。
- [Lucide React](https://lucide.dev/) - シンプルで美しいアイコンセット。
- [Zustand](https://github.com/pmndrs/zustand) - React 用の状態管理ライブラリ。
- [js-yaml](https://github.com/nodeca/js-yaml) - JavaScript 用 YAML パーサー。

## ライセンス
MIT
