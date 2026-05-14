## Requirements

### Requirement: modscape spec build — 静的 spec ブラウザの出力
`modscape spec build [outDir]` は `.modscape/specs/` 配下の HTML spec ファイルを出力ディレクトリにコピーし、vanilla JS ナビゲーション付きの `index.html` を生成しなければならない（SHALL）。デフォルトの出力ディレクトリは `dist/specs/` とする（SHALL）。

#### Scenario: modscape spec build で dist/specs/ が生成される
- **WHEN** `modscape spec build` を実行する
- **THEN** `dist/specs/` に `index.html` と各スラグ配下の spec ファイルがコピーされる

#### Scenario: カスタム出力ディレクトリを指定できる
- **WHEN** `modscape spec build ./my-output` を実行する
- **THEN** `./my-output/` に spec ブラウザが出力される

### Requirement: 静的 index.html の構造
生成される `index.html` は左ペインにモデルスラグ別テーブル一覧、右ペインに iframe を持つ 2 カラムレイアウトを vanilla JS で実装しなければならない（SHALL）。テーブルを選択すると iframe の src が対応する spec ファイルのパスに切り替わらなければならない（SHALL）。

#### Scenario: 静的ブラウザでテーブルを選択すると右ペインに spec が表示される
- **WHEN** 生成された `index.html` をブラウザで開き、テーブルを左ペインから選択する
- **THEN** 右ペインの iframe に対応する `.html` spec ファイルが表示される

### Requirement: 出力ディレクトリの構造
```
dist/specs/
  index.html                        ← spec ブラウザ（静的）
  <slug>/
    <tableId>.html
    ...
```

#### Scenario: スラグ別サブディレクトリが作成される
- **WHEN** `modscape spec build` を実行し、`.modscape/specs/retail-analytics/fct_orders.html` が存在する
- **THEN** `dist/specs/retail-analytics/fct_orders.html` が生成される
