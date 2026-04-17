## Context

modscape:spec の SDD ワークフローは `requirements → design → implement → archive` の一方向パイプラインとして設計されている。archive 時に生成される `specs/<table-id>.md` や `specs/questions.md` は恒久知識として蓄積されるが、次の change を設計する際にその知識が自動的に参照されない。

具体的に生じている問題：
- 同じテーブルを含む新しい change を設計するとき、`specs/questions.md` に積み上がった未解決質問が参照されず、既知の問題を設計者が見落とす。
- 過去に似たパターン（例：monthly incremental mart）を実装した archive が `.modscape/archives/` に存在しても、新しい設計者はゼロから設計する。

## Goals / Non-Goals

**Goals:**
- `design` ステップで Direct Impact テーブルに関連する `specs/questions.md` の未解決質問（Q-NNN ID）を参照として自動挿入する
- `modscape spec search <keyword>` CLI コマンドを追加し、archives と specs を横断検索できるようにする
- `/modscape:spec:search` スキルが検索結果を読み込み、ユーザーの明示的な指示で関連部分を設計に取り込む

**Non-Goals:**
- 質問への自動回答
- 過去 spec の自動マージ（取り込みは明示的指示が必要）
- 全文検索エンジンやベクター検索の導入

## Decisions

### 1. questions 参照は ID のみ、本文コピーなし

`design.md` への挿入は質問の全文コピーではなく Q-NNN の参照リンクのみとする。

```markdown
## Known Open Questions (from specs/questions.md)
Direct Impact テーブルに関連する未解決の質問:
- Q-012, Q-015 → `fct_orders` — see .modscape/specs/questions.md
```

**理由**: 質問の本文は `specs/questions.md` が正本。コピーを持つと二重管理になり陳腐化する。参照だけで設計者が必要に応じて確認できれば十分。

### 2. `modscape spec search` は CLI コマンドとして実装

スキル内の grep で完結させる案も検討したが、CLI コマンドとして実装することで以下のメリットが得られる：
- どの AI ツール（Claude/Gemini/Codex）からも同じ方法で呼び出せる
- `--json` フラグで機械可読な出力を提供しスキルが解析しやすい
- 将来的に検索インデックスの拡張が容易

**実装方針**: `src/search.js` に追加。検索対象は `.modscape/archives/*/spec.md`・`.modscape/archives/*/design.md`・`.modscape/specs/*.md`。キーワードによるテキストマッチ。

```bash
modscape spec search <keyword> [--json] [--limit <n>]
```

出力形式（通常）:
```
Found 3 results for "monthly incremental":

[1] archives/2026-03-15-monthly-sales/
    Spec: Monthly Sales Summary Pipeline
    Match: design.md — "incremental mart with monthly partition"

[2] archives/2026-02-28-revenue-rollup/
    Spec: Revenue Rollup
    Match: spec.md — Data Sources: fct_orders (incremental)
```

### 3. design 時の過去 spec サジェストは自動参照のみ

design ステップが `modscape spec search` を内部的に呼び出し、Direct Impact テーブルに関連する過去 spec を自動で探す。結果は `design.md` の `## Related Past Specs` セクションに記録する。取り込みはユーザーの明示的指示（「Q の設計を取り込んで」等）があった場合のみ実施。

## Risks / Trade-offs

- **archives が存在しない環境**: 新規プロジェクトでは `.modscape/archives/` が空。`modscape spec search` は結果ゼロで正常終了するだけなのでリスクなし。
- **Q-NNN の参照ずれ**: `specs/questions.md` の質問が別の change で回答・削除された場合、design.md の参照が宙に浮く。現状の設計では許容（設計者が確認時に気づける）。
- **search のノイズ**: テキストマッチのみのため無関係な結果が混じる可能性。`--limit` でデフォルト 5 件に絞りノイズを抑制する。
