# yaml-viewer Specification

## Purpose
The YAML Viewer provides a read-only view of the current data model in YAML format, allowing users to see the underlying code structure of their visual model. It also manages the overall layout of the left panel tabs.

## Requirements

### Requirement: 左パネルのタブ構成
左パネルのタブは「YAML」「Stats」の2タブ構成にしなければならない（SHALL）。Connect タブは削除しなければならない（SHALL）。Stats タブは Model Stats（ホットスポット・孤立テーブル・集計数）を表示しなければならない（SHALL）。

#### Scenario: 左パネルに YAML と Stats の2タブが存在する
- **WHEN** ユーザーが左パネルを開く
- **THEN** YAML タブと Stats タブの2つのタブのみが表示される

#### Scenario: Stats タブでモデル統計が閲覧できる
- **WHEN** ユーザーが Stats タブを選択する
- **THEN** テーブル数・リレーション数・Lineage数・ドメイン数の集計と、Lineageホットスポット一覧、孤立テーブル一覧が表示される

### Requirement: YAMLビューワーの表示
サイドバーのYAMLタブは現在のスキーマ状態をYAML形式で読み取り専用表示しなければならない（SHALL）。ユーザーはビジュアライザー内でYAMLを直接編集できてはならない（MUST NOT）。タブヘッダーには "Diff" トグルボタンを表示しなければならない（SHALL）。

#### Scenario: YAMLがリアルタイムに更新される
- **WHEN** ユーザーがグラフ上でノードの追加・削除・移動などの操作を行う
- **THEN** サイドバーのYAMLタブが最新のスキーマ状態を即座に反映する

#### Scenario: 編集操作が無効化されている
- **WHEN** ユーザーがYAMLビューワー上でテキストを入力しようとする
- **THEN** 入力は受け付けられず、テキストは変更されない

#### Scenario: Diff トグルが表示される
- **WHEN** ユーザーがYAMLタブを開く
- **THEN** タブヘッダーに "Diff" トグルボタンが表示される

### Requirement: ファイル切り替え時のYAML更新
ファイルを切り替えた場合、YAMLビューワーは切り替え後のファイルの内容を表示しなければならない（SHALL）。

#### Scenario: ファイルを切り替えたときにYAMLが更新される
- **WHEN** ユーザーがファイルセレクターで別のモデルファイルを選択する
- **THEN** YAMLビューワーが選択されたファイルのスキーマを表示する

