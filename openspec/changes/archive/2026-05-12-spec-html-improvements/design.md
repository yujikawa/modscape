## Context

HTML版specの成果物（spec.html / design.html / tasks.html / questions.html / table-spec.html）は、すべてのテンプレートが `background: #0f172a`（濃いネイビー）を基底色とするダークモード固定のデザインを持つ。`modscape spec dev` でビューアを開いた場合、OSのテーマ設定に関係なく常にダーク表示になる。ライトモード対応は `spec.js` の `LIGHT_MODE_CSS` 定数として管理され、`?theme=light` クエリパラメータ付きで取得した際にHTMLの `</body>` 直前に注入するという2重構造になっている。

また、`/modscape:spec:check`（validateスキル）・`/modscape:spec:generate`・`/modscape:spec:note` の3スキルが `output_format: html` 設定を考慮しておらず、HTML modeで動作させると整合性チェックや永続spec生成が正しく機能しない問題がある。

## Goals / Non-Goals

**Goals:**
- 全HTMLテンプレートをOSテーマに依存しない単一カラースキームに書き換える
- `spec.js` のLIGHT_MODE_CSS注入コードを削除してコードを簡潔にする
- `check.md` のMarkdown前提パース指示をHTML構造対応に修正する
- `generate.md` / `note.md` に `output_format: html` 時の動作を追加する

**Non-Goals:**
- ダークモード切り替え機能の追加（今後の課題として保留）
- Gemini / Codex版スキルへの即時同期（後続タスクとして実施可）
- `glossary.md` のHTML化（意図的にMD固定のstaging fileのため対象外）

## Decisions

### カラースキーム: ライトグレーベース（単色系）

**決定**: 全テンプレートを `#f8f9fa`（body背景）ベースの中間色スキームに統一する。

| 役割 | 変更前（ダーク） | 変更後（ライトグレー） |
|---|---|---|
| body背景 | `#0f172a` | `#f8f9fa` |
| カード背景 | `#1e293b` | `#ffffff` |
| カード境界線 | `#334155` | `#e2e8f0` |
| テキスト（本文） | `#cbd5e1` | `#334155` |
| テキスト（見出し） | `#f1f5f9` | `#0f172a` |
| コードブロック背景 | `#0d1117` | `#f1f5f9` |
| コードブロック文字 | `#e2e8f0` | `#1e293b` |
| バッジ（status） | `#1e3a5f` / `#93c5fd` | `#dbeafe` / `#1d4ed8` |

**理由**: ダーク/ライトの2系統を維持すると、テンプレート修正のたびに両方の色定義を更新する必要があり、乖離が発生しやすい。spec devビューアは主に作業中の参照用途であり、「目が疲れない明るめの配色」が最適。OSテーマに依存しない単一スキームにすることで保守コストを下げる。

**代替案（却下）**: `prefers-color-scheme` メディアクエリでCSS変数を切り替える案 → テンプレートがLLM生成であるため、CSS変数スキームを正確に扱うことが難しく、かえって複雑になる。

### LIGHT_MODE_CSS の削除

**決定**: `spec.js` の `LIGHT_MODE_CSS` 定数とその注入ロジック（`if (req.query.theme === 'light')` ブロック）を削除する。

**理由**: テンプレート自体がライトベースになれば不要。`?theme=light` クエリパラメータのサポートも同時に終了させる（ユーザー向けドキュメントに記載があれば削除）。

### check.md のHTML mode対応方針

`output_format: html` の場合、以下の3箇所をHTML構造ベースに切り替える。

| 箇所 | 変更前（MD前提） | 変更後（HTML対応） |
|---|---|---|
| D-1 未解決質問の検出 | `- [ ]` パターンを検索 | `<div class="q-item">` かつ `data-status="open"` またはクラス `open` を持つ要素を数える |
| Part2 未解決質問カウント | `- [ ]` 行数カウント | 同上（クラス `open` を持つ `.q-item` の個数） |
| Part2 Assumptions検索 | `**仮定:**` / `**Assumption:**` テキスト | `data-type="assumption"` 属性またはクラス `assumption` を持つ要素のテキスト、あるいは「仮定:」「Assumption:」を含む `<p>` / `<div>` を検索 |
| Part2 AC Coverage | `AC-NNN:` パターン抽出 | `<span class="ac-id">` の中のテキストを抽出 |
| Part2 AC Coverage | `[→ AC-NNN]` パターン検索 | `.task-text` スパン内の `[→ AC-NNN]` テキストを検索（HTMLでも文字列は保持される） |

**方針**: HTMLテンプレートにはクラス名でセマンティクスが表現されているため、LLMはHTMLを読んでクラスベースで抽出できる。指示文にHTML modeの代替パターンを追加する形で対応する。

### generate.md / note.md の HTML mode 対応

**generate.md**: Step 4に `output_format: html` 時の分岐を追加する。HTML modeでは `table-spec-template.html` を参照して `.html` ファイルを生成する。出力パスは `.modscape/specs/<model-slug>/<table-id>.html`。

**note.md**: Step 3の「spec fileの存在確認」とStep 6の「ファイル読み書き」で、HTML modeのときは `.html` 拡張子のファイルを対象にする。HTML内のセクション検索はHTMLクラス/要素構造ベースで行う（`## Business Rules` → `<section id="business-rules">` または `<h2>` を含む要素）。

## Risks / Trade-offs

- **リスク: HTMLテンプレートが複数あるため書き換えの抜け漏れが発生する可能性**
  → 全5テンプレートを一括確認するチェックリストをtasksに含める

- **リスク: check.md のHTML mode指示が増えると可読性が下がる**
  → 「MD modeの場合 / HTML modeの場合」を明示的に条件分岐として記述し、視認性を確保する

- **トレードオフ: `?theme=light` クエリパラメータのサポート終了**
  → 現時点でユーザー向けドキュメントには記載がなく、影響範囲は限定的
