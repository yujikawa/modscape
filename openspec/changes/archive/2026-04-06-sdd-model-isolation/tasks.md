## 1. sdd-designスキル更新

- [x] 1.1 `sdd-design` スキルのプロンプトにextractステップを追加（spec.mdのData Sourcesから関連テーブルを判断し `modscape extract` を実行）
- [x] 1.2 mutation CLIの対象を `sdd/<name>/model.yaml` に変更（HR.yamlを直接編集しないよう更新）
- [x] 1.3 `modscape layout` の対象を `sdd/<name>/model.yaml` に変更
- [x] 1.4 完了後の案内メッセージに `modscape dev sdd/<name>/model.yaml` の使い方を追記

## 2. sdd-implementスキル更新

- [x] 2.1 `sdd-implement` スキルのプロンプトの参照先を `sdd/<name>/model.yaml` に変更

## 3. sdd-archiveスキル更新

- [x] 3.1 `sdd-archive` スキルのプロンプトにmergeステップを追加（`modscape merge sdd/<name>/model.yaml <master>.yaml --output <master>.yaml`）
- [x] 3.2 重複テーブルID検出時の警告メッセージをプロンプトに追加
- [x] 3.3 archiveの手順順序を「merge → specs同期 → 削除確認」に整理

## 4. modscape mergeコマンド更新

- [x] 4.1 `src/merge.js` の重複スキップ処理に警告ログを追加（`⚠ <id>: also exists in a later file — using first version`）

## 5. ドキュメント・CHANGELOG更新

- [x] 5.1 `CHANGELOG.md` にmodel.yaml分離のエントリを追加
