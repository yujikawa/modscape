## Context

v2.4.0 でYAMLエディタが読み取り専用になった。DetailPanelでUI操作をしても、YAMLのどのフィールドが変わったか確認する手段がない。ユーザーはUIで編集しながら変更差分を把握したいが、常にdiffが表示されているとパフォーマンスへの懸念が生じる。

## Goals / Non-Goals

**Goals:**
- ON/OFF トグルで unified diff を表示・非表示できる
- baseline はディスクから読み込んだ時点の YAML とする
- 外部ライブラリを使わず自前実装する
- OFF 時はコスト完全ゼロ

**Non-Goals:**
- 左右分割（merge view）
- diff を元に戻す操作（undo/redo で代替）
- 行レベル以下のインライン diff（単語単位のハイライト等）

## Decisions

### baseline の管理

**決定**: Zustand store に `baselineYaml: string` を追加し、モデルロード時（`loadModel`）と外部変更受信時（`refreshModelData`）にのみ更新する。UI操作（`syncToYamlInput`）では更新しない。

**理由**: UIで編集した変更を「ディスク上の状態との差分」として見せるのが自然。undo後に baseline がずれると混乱する。

### diff 計算の実装方針

**決定**: 外部ライブラリを使わず、行単位の Myers diff（LCS ベース）を utility 関数として自前実装する。

**理由**: YAML の行数は通常数百行。Myers diff はこのサイズで数ミリ秒以内。外部依存追加によるライセンス・バンドルサイズへの影響を避けられる。

**代替案**: `diff` パッケージ（BSD-3-Clause）→ 依存追加が不要ならそれに越したことはないため却下。

### ON/OFF トグルの配置

**決定**: YAMLサイドバータブのヘッダー部分に "Diff" トグルボタンを追加。トグル状態は React の `useState` で管理（store に持たせない）。

**理由**: diff 表示の ON/OFF はセッションローカルな UI 状態であり、永続化不要。

### diff が空の場合の表示

**決定**: "No changes" のメッセージを表示する（diff ON で変更なし）。

## Risks / Trade-offs

- **巨大モデルでの計算コスト**: テーブルが数百個の場合、YAML が数千行になる可能性がある。Myers diff は O(N*D) なので変更が少なければ高速だが、全行変更のような極端なケースでは遅くなり得る。→ ON/OFF トグルがあるため、ユーザーが意図的に有効化する場合のみ計算する。
- **baseline ずれ**: モデル切り替え後に baseline がリセットされないと誤った diff になる。→ `loadModel` 時に必ず baseline を更新する。
