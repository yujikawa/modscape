## Context

現在の `modscape lint <file>` は単一ファイルを対象とした検査のみをサポートしており、複数の model YAML をまたぐ構造的な問題（同一テーブルIDの重複定義）を検知できない。

また `modscape extract` の `tableMap.set(table.id, table)` は、複数ファイルに同一IDが存在する場合に後発ファイルの定義で静かに上書きする（last-wins）。この挙動はAIエージェントや開発者が意図せず古い定義を使ってしまうリスクを生む。

## Goals / Non-Goals

**Goals:**
- `modscape lint` が複数ファイル指定・ディレクトリ指定を受け付けるようインターフェースを拡張する
- `no-duplicate-table-ids` ルールを追加し、`imports:` で明示的に参照されていない重複テーブルIDを `warn` で報告する
- `modscape extract` が同一テーブルIDの上書き発生時に `WARN` を stderr に出力する

**Non-Goals:**
- 重複を自動修正する `canonicalize` コマンドの追加（別 change として検討）
- lint をブロッキングエラーにするデフォルト変更（warn に留める）
- YAML スキーマ構造の変更

## Decisions

### 1. lint のマルチファイル対応: 新関数 `lintModels()` を追加

**選択**: 既存の `lintModel(filePath)` を変更せず、複数ファイルを受け取る `lintModels(filePaths[], opts)` を新設する。

**理由**: 既存の単一ファイル lint は他の箇所でも使われる可能性があり、インターフェースを壊さない方がリスクが低い。CLI レイヤーでファイル収集（ディレクトリ展開・グロブ）を行い、`lintModels` に渡す。

**代替案**: `lintModel` を配列対応に変更 → 既存の呼び出し元への影響が読みきれないため却下。

### 2. no-duplicate-table-ids の import 考慮ロジック

**選択**: 各ファイルの `imports[].from` + `imports[].ids` を読み取り、import 先で定義されているテーブルIDはチェック対象外とする。

```
fileA.yaml → tableA を定義
fileB.yaml → imports: [{ from: fileA.yaml, ids: [tableA] }]
```

この場合、fileB.yaml に tableA が存在しても重複 **ではない**（正しい構造）。

チェック対象: `imports:` で参照されていない状態で同一IDが複数ファイルに存在する場合。

**理由**: import 関係を考慮しないと正しく使っているモデルにまで警告が出る。

### 3. extract の警告タイミング

**選択**: `tableMap.set(table.id, table)` の前に `tableMap.has(table.id)` をチェックし、上書きが発生する場合に stderr へ `WARN` を出力する。

```
WARN: tableA  duplicate-table-id
  Found in: main-model1.yaml (first), main-model2.yaml (overwriting)
  Using definition from: main-model2.yaml
```

last-wins の挙動自体は **変更しない**（既存動作との互換性維持）。警告のみ追加する。

**理由**: extract の last-wins を変更するとパイプライン利用者が破壊的変更を受ける可能性がある。まず警告で認識させることを優先する。

## Risks / Trade-offs

- **import パスの解決複雑性** → `imports[].from` は相対パスで書かれるため、ファイルの配置によって解決が変わる。`path.resolve()` を使ってフルパスで比較することで対処する。
- **ディレクトリ lint 時のスコープ** → 意図しない YAML（設定ファイル等）も対象になる可能性がある。`version:` フィールドを持つファイルのみを model YAML とみなすフィルタで対処する。
- **警告の多発** → 既存プロジェクトで重複が多い場合、初回 lint 時に大量の warn が出る。デフォルト `warn` のため終了コードには影響しない。
