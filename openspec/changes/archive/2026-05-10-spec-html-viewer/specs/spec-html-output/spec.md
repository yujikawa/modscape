## ADDED Requirements

### Requirement: output_format設定によるHTML出力切り替え
`modscape-spec.custom.md` に `output_format: html` が設定されている場合、各specスキル（requirements / design / tasks / questions / answer / amend）はMarkdownではなくHTMLファイルを生成しなければならない（SHALL）。ファイル拡張子は `.html` となる。

#### Scenario: output_format: html 設定時にspec.htmlが生成される
- **WHEN** `modscape-spec.custom.md` に `output_format: html` が記載されている状態で `/modscape:spec:requirements` を実行する
- **THEN** `.modscape/changes/<name>/spec.html` が生成され、`.modscape/changes/<name>/spec.md` は生成されない

#### Scenario: output_format未設定時はMarkdownが生成される（デフォルト動作）
- **WHEN** `modscape-spec.custom.md` に `output_format` が記載されていない状態でspecスキルを実行する
- **THEN** 従来通り `.md` ファイルが生成される

### Requirement: HTML成果物の品質基準
HTMLとして生成される成果物はインラインCSSのみを使用し、外部CDNへの依存なしに単体でブラウザ表示できなければならない（SHALL）。

#### Scenario: spec.htmlがオフラインで表示できる
- **WHEN** `spec.html` をネットワーク接続なしのブラウザで開く
- **THEN** スタイルが正しく表示され、すべてのコンテンツが読める

#### Scenario: design.htmlがSVGでlineage図を含む
- **WHEN** lineageエントリが存在するspec-model.yamlからdesign.htmlを生成する
- **THEN** design.htmlにはテーブル間の依存関係を示すSVG図が含まれる

### Requirement: HTML生成時のファイル参照整合性
specスキルが既存ファイルを参照・更新する際（design.md → design.html等）、`output_format: html` 設定下では `.html` 拡張子のファイルを対象にしなければならない（SHALL）。

#### Scenario: design再実行時に既存のdesign.htmlを更新する
- **WHEN** `output_format: html` 設定下で `/modscape:spec:design` を再実行する
- **THEN** `design.html` が更新され、`design.md` は参照も生成もされない
