## Context

現在の `modscape:spec` ワークフローでは、各スキルが `.modscape/changes/<name>/` 配下にMarkdownファイルを生成する。レビュー時はこれらのファイルを個別に開きつつ、`modscape dev` でグラフを確認するという行き来が発生している。

既存の `modscape dev` は Express + React(Cytoscape.js) による可視化サーバーで、`/api/model` を通じてYAMLを配信する。スキルファイルは `src/templates/claude/spec/*.md` に格納され、`modscape-spec.custom.md` がすべてのスキルで最優先ルールとして読み込まれる仕組みがある。

## Goals / Non-Goals

**Goals:**
- `output_format: html` 設定時にスキルがHTMLファイルを生成する
- `modscape dev --spec <name>` で左ペイン（グラフ）＋右ペイン（HTMLタブ）の統合ビューアを起動する
- `modscape init --html` で `output_format: html` を `modscape-spec.custom.md` に追記する
- HTMLファイルの変更をライブリロードで反映する

**Non-Goals:**
- HTMLファイルをGitでdiff表示することの改善（既知のデメリットとして受け入れる）
- Gemini / Codex版スキルへの即時同期（Claude版を先行実装し、後から反映）
- tasks.htmlのチェックボックス状態をYAMLへ書き戻す双方向同期

## Decisions

### 1. output_format の検出はruntime（modscape-spec.custom.md読み込み時）

**決定:** スキルファイルは1種類のみ維持し、実行時に `modscape-spec.custom.md` の `output_format: html` を検出して出力形式を切り替える。

**理由:** init時にスキルファイルを2種類生成・管理するよりも、既存の「custom.mdが最優先」という仕組みを活かす方がメンテナンスコストが低い。スキルファイルへの追記は各ファイルの冒頭ルール検出ステップに1ブロック追加するだけで済む。

**代替案:** `init --html` 時にHTMLバージョンのスキルファイルを別途生成する → スキルファイルの二重管理が発生するため却下。

### 2. `modscape dev --spec <name>` は既存devコマンドのオプションとして追加

**決定:** 新しいサブコマンドではなく、`modscape dev` に `--spec` オプションを追加する形で実装する。

**理由:** devサーバーの基本構造（Express + WebSocket + chokidar）を再利用できる。`--spec` 指定時は `scanFiles` をスキップし、`.modscape/changes/<name>/spec-model.yaml` を直接モデルとして読み込む。

**代替案:** `modscape spec view <name>` という別コマンド → 実装の重複が増えるため却下。

### 3. ReactのspecモードはApp.tsx内の条件分岐で実現

**決定:** `window.MODSCAPE_SPEC_MODE` と `window.MODSCAPE_SPEC_NAME` をサーバーが注入し、App.tsx がこれを検出してレイアウトを切り替える。specモード時は `<SpecPanel>` を右ペインとして表示する。

**理由:** 既存のCytoscapeCanvasは `spec-model.yaml` をそのまま食わせられるため、グラフ部分の改修は最小限で済む。新規コンポーネント `SpecPanel.tsx` はHTMLファイルをiframeで表示するだけのシンプルな構造にする。

**代替案:** 完全に別のHTMLページとして提供する → ライブリロードや状態管理の共通化が難しいため却下。

### 4. HTMLテンプレートは `src/templates/spec/html/` に配置し、init時にコピー

**決定:** エージェント共通のHTMLテンプレートを `src/templates/spec/html/` に置き、`modscape init --html` 時に `.modscape/spec-templates/` へコピーする。スキルはこのテンプレートを読み込んで穴埋め形式でHTMLを生成する。

**理由:** テンプレートはClaude/Gemini/Codex共通の成果物であり、`claude/` 配下に置くのは不適切。`init` でプロジェクト側にコピーすることで、ユーザーがプロジェクト固有のデザインにカスタマイズできる。

**代替案:** スキル指示にHTML構造をインラインで埋め込む → スキルファイルが肥大化しデザイン変更が散らばるため却下。

### 5. HTMLファイルの表示はiframe方式

**決定:** `SpecPanel` は `/api/spec/<name>/<file>` エンドポイントから取得したHTMLをiframeで表示する。

**理由:** AIが生成するHTMLは自己完結したスタイル（インラインCSS）を持つ。iframeにより本体のReactアプリとスタイルが干渉しない。タブ切り替えはiframeのsrcを変更するだけで実装できる。

## Risks / Trade-offs

- **[リスク] HTMLファイルのGit diffがノイジー** → これは受け入れるトレードオフ。PRにはMarkdown版も参考として残すオプションを後から検討できる。
- **[リスク] AIが生成するHTMLの品質がスキルの指示に依存する** → 各スキルに「HTML品質ガイドライン」セクションを追加し、最低限のデザイン基準（Tailwind CDN / インラインCSS、SVGでlineage図など）を規定する。
- **[リスク] spec-model.yamlが存在しない状態で `--spec` を実行した場合** → dev.jsでファイル存在チェックを行い、エラーメッセージを表示する。グラフペインは空表示でHTMLタブのみ動作させる。
- **[トレードオフ] iframeはセキュリティ制約があり、外部リソース読み込みが制限される場合がある** → AIへの指示でインラインCSS優先・外部CDN不使用を推奨する。ローカルdev環境のみの利用想定のため許容範囲内。
