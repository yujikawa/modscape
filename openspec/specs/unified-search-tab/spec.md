# unified-search-tab Specification

## Purpose
The Unified Search Tab provides a central place for users to discover and navigate through the data model. It intelligently switches between a domain-based hierarchy and a full-text search based on user input.

## Requirements

### Requirement: 統合 Search タブの表示切り替え
右パネルの Search タブは検索ワードの有無によって表示内容を自動切り替えしなければならない（SHALL）。

#### Scenario: 未入力時はドメイン階層ツリーを表示する
- **WHEN** ユーザーが Search タブを開き検索ワードを入力していない
- **THEN** ドメインでグルーピングされたテーブル/Consumerのツリー一覧が表示される

#### Scenario: 入力時はフルテキスト検索結果を表示する
- **WHEN** ユーザーが検索ワードを入力する
- **THEN** テーブル名・論理名・物理名・説明・カラム名・カラム説明をキーワードでマッチしたヒット結果が表示される

#### Scenario: 検索ワードをクリアするとツリーに戻る
- **WHEN** ユーザーが検索ワードを削除して空にする
- **THEN** ドメイン階層ツリー表示に戻る

### Requirement: 右パネルのタブ削減
右パネルのタブは Search / Path Finder / Note Search の3タブ構成にしなければならない（SHALL）。Tables タブ・Information Search タブ・Model Stats タブは削除しなければならない（SHALL）。

#### Scenario: 右パネルに3タブのみ存在する
- **WHEN** ユーザーが右パネルの ActivityBar を見る
- **THEN** Search・Path Finder・Note Search の3つのアイコンボタンのみが表示される
