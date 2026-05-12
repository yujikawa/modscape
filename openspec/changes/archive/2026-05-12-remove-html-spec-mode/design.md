## Context

v3.4.0 で HTML 出力モードを導入したが、`marked` + `highlight.js` によるサーバーサイド MD→HTML 変換の実装後、MDファイルで十分な表示品質が得られることが判明した。HTML モードは skill の複雑化・トークン増大を引き起こしており、廃止する。

現在の HTML mode 関連ファイル：
- `src/templates/spec/html/` — HTML テンプレート 5 ファイル
- Claude/Gemini/Codex の全 spec skill — MD/HTML dual-path ロジックを含む
- `src/init.js` — `--html` フラグ処理
- `src/spec.js` — `specNew()` 内の html 分岐
- `src/index.js` — `--html` オプション定義

## Goals / Non-Goals

**Goals:**
- HTML テンプレートを削除する
- 全 spec skill を MD のみに統一・シンプル化する
- CLI から `--html` フラグを削除する
- `output_format` 設定キーを廃止する
- README/CHANGELOG を更新する

**Non-Goals:**
- `src/spec.js` の `marked`/`highlight.js` による MD 表示機能は削除しない（これは維持）
- `modscape-spec.config.yaml` ファイル自体の廃止（他のキーが残る可能性があるため）
- `modscape spec dev` / `spec open` / `spec build` コマンドの変更

## Decisions

**HTML テンプレートは完全削除**
`src/templates/spec/html/` ディレクトリごと削除する。`modscape init` で `.modscape/spec-templates/` にコピーされている場合はそのままにする（ユーザーデータのため）。

**skill は Claude を先に修正、Gemini/Codex は Claude から同期**
CLAUDE.md のルールに従い Claude を source of truth として修正し、その後 Gemini/Codex に反映する。

**`output_format` キーの削除方針**
- `modscape-spec.config.yaml` から `output_format` を読んでいる箇所をすべて削除
- ファイル自体は存在していても問題ない（無視されるだけ）

**`specNew()` の html 分岐削除**
`spec.js` の `specNew()` は常に `.md` 拡張子でスキャフォールドするよう変更する。

## Risks / Trade-offs

- 既存プロジェクトで `output_format: html` を使っているユーザーへの影響あり（ただし現時点ではほぼいない想定）
- HTML で生成済みの `.html` スペックファイルは `spec dev` で引き続き表示可能（フォールバックは `.html` → `.md` の順なので後方互換あり）
