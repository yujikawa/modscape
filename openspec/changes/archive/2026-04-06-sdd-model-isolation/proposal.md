## Why

現在の `/modscape:sdd:design` は本番のmodel.yaml（例: HR.yaml）を直接編集するため、複数specが並行すると「どの変更がどのspecによるものか」が追跡困難になる。また作業途中の不完全な状態が本番YAMLに混入するリスクがある。

## What Changes

- **SDD作業中はHR.yamlを直接変更しない**: designステップが`sdd/<name>/model.yaml`（作業用YAML）を作成・編集する
- **extractで関連テーブルを抜き出す**: spec.mdのData Sourcesを読んでAIが対象テーブルを判断し、`modscape extract`で抽出
- **archiveでHR.yamlにマージ**: `modscape merge sdd/<name>/model.yaml HR.yaml`でspec側優先でマージ
- **`modscape merge`に重複警告を追加**: 重複テーブルIDを無言でスキップしていたのを警告ログ付きに変更

## Capabilities

### New Capabilities

- `sdd-model-isolation`: SDD作業用model.yamlの分離パターン定義（extract → 作業 → merge）

### Modified Capabilities

- `sdd-design`: extractによる作業用`sdd/<name>/model.yaml`生成を追加、HR.yamlの直接編集を廃止
- `sdd-implement`: 参照先を`sdd/<name>/model.yaml`に変更
- `sdd-archive`: `modscape merge`でHR.yamlへのマージを追加

## Impact

- `src/templates/claude/sdd/design.md` — extractフロー追加
- `src/templates/claude/sdd/implement.md` — 参照先変更
- `src/templates/claude/sdd/archive.md` — mergeフロー追加
- `src/merge.js` — 重複スキップ時の警告ログ追加
