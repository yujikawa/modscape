# command-palette-connect Specification

## Purpose
Command Palette（Ctrl+K）に Connect モード（ER/Flow）を統合する。左パネルの QuickConnect タブを廃止し、接続操作を Command Palette に集約することで、「操作」の発見性を高め、左パネルを「閲覧」に特化させる。

## Requirements

### Requirement: Command Palette に Connect モードを追加
Command Palette（Ctrl+K）を開いたとき、Pipeline モードと Connect モード（ER/Flow）をモード選択として表示しなければならない（SHALL）。

#### Scenario: Command Palette 起動時にモード選択が表示される
- **WHEN** ユーザーが Ctrl+K を押して Command Palette を開く
- **THEN** Pipeline / Connect ER / Connect Flow のモード選択UIが表示される

#### Scenario: Connect ER モードで Source/Target 入力フォームが表示される
- **WHEN** ユーザーが「Connect ER」モードを選択する
- **THEN** Source 入力・リレーション種別セレクター・Target 入力・Connect ボタンのフォームが表示される

#### Scenario: Connect Flow モードで Source/Target 入力フォームが表示される
- **WHEN** ユーザーが「Connect Flow」モードを選択する
- **THEN** Source 入力（Lineage）・Target 入力・Connect ボタンのフォームが表示される

### Requirement: 候補表示のグループ化
Connect フォームの候補ドロップダウンはテーブル単位でグループ化して表示しなければならない（SHALL）。テーブル行とカラム行を視覚的に区別しなければならない（SHALL）。

#### Scenario: テーブルとカラムが視覚的に区別される
- **WHEN** ユーザーが Source 入力フィールドに文字を入力する
- **THEN** テーブルIDは太字で表示され、カラムはインデントされた細字で表示される

#### Scenario: Bulk 候補が専用行として表示される
- **WHEN** ERモードで Target フィールドに `.id` のようなカラム名を入力する
- **THEN** `*.id [Bulk]` という専用行がドロップダウンの末尾に表示される

### Requirement: QuickConnect タブの廃止
左パネルから QuickConnect タブを削除しなければならない（SHALL）。`L` キーショートカット（QuickConnect を開く）を廃止し、Ctrl+K（Command Palette）で代替しなければならない（SHALL）。

#### Scenario: 左パネルに Connect タブが存在しない
- **WHEN** ユーザーが左パネルのタブを見る
- **THEN** Connect タブが存在しない

#### Scenario: L キーが Connect タブを開かなくなる
- **WHEN** ユーザーがキャンバスにフォーカスした状態で L キーを押す
- **THEN** Connect タブは開かず、何も起きないか Ctrl+K の代替案内が表示される
