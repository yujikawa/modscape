## Context

現在の `modscape validate` コマンド（`src/validate.js`）は構造的整合性（参照切れ・座標配置ミス・重複ID等）を検査する。一方で、ドキュメント品質（descriptionの有無・型定義の充実度）やモデリングベストプラクティス（PK定義・kindに応じた必須フィールド）の検査は対象外であり、CI/CDゲートとして使いにくい面がある。また、モデルを長期運用すると削除済みテーブルへの参照がrelationship/lineage/layoutに残り続けるが、それを一括除去するコマンドが存在しない。

## Goals / Non-Goals

**Goals:**
- `modscape lint <file>` — `.modscape/lint-rules.yaml` で設定したルールに基づいてモデルの品質検査を行い、error/warnを報告する
- `modscape prune <file>` — 孤立テーブル・参照切れエントリをdry-runで一覧表示し、`--write` で実際にYAMLから除去する
- 両コマンドとも `--json` オプションでCI/CDに組み込み可能
- 設定ファイルなしでもデフォルトルールセットで動作する

**Non-Goals:**
- 既存の `modscape validate` が担う構造的整合性チェック（lint/pruneは重複しない）
- YAMLのauto-fix（欠如した情報は人間またはAIが補完する）
- SQL方言ごとのDDL生成
- UIへのlint結果の表示

## Decisions

### 決定1: lint と validate を分離したコマンドとして実装する

**採用**: `modscape lint` を新コマンドとして追加し、`validate` は手を加えない。

**理由**: validateは「YAMLが壊れていないか」、lintは「YAMLが品質基準を満たしているか」という異なる関心事を担う。マージすると出力が混在してCI用途で扱いにくくなる。

**却下案**: validate に `--strict` フラグを追加して品質チェックを兼ねる → チェックの粒度が異なるためオプションで切り替える設計にすると設定が複雑になる。

---

### 決定2: ルール設定はESLintスタイルのYAMLファイル

**採用**: `.modscape/lint-rules.yaml` で各ルールを `severity: error|warn|off` + オプション（`kinds`, `target` 等）で設定する。

```yaml
rules:
  require-description:
    severity: error
    target: tables        # tables | columns | all
  require-physical-name:
    severity: warn
    kinds: [fact, mart, dimension]
  require-primary-key:
    severity: error
  require-column-type:
    severity: warn
  require-tags:
    severity: warn
    kinds: [fact, mart]
  no-orphan-references:
    severity: error
  incremental-requires-merge-key:
    severity: error
```

**理由**: データエンジニアにESLint設定は馴染みがある。`kinds` フィルターをルールごとに持てるため、特定のモデリングパターン（factにBEAMタグ必須など）を柔軟に表現できる。

**却下案**: TOML/JSON形式 → プロジェクト内の設定ファイルがYAMLで統一されているため不要な多様化を避ける。

---

### 決定3: prune はデフォルトdry-run、`--write` で書き込み

**採用**: `modscape prune model.yaml` は削除対象の一覧を表示するのみ。`modscape prune model.yaml --write` で初めてYAMLを書き換える。

**理由**: pruneは削除操作であり、誤操作のリスクが高い。確認フローを強制することで意図しない削除を防ぐ。

**却下案**: `--dry-run` フラグで切り替え（書き込みがデフォルト）→ CLIの一般的な慣習として破壊的操作はデフォルトオフが安全。

---

### 決定4: pruneの検出対象

以下を検出対象とする（優先度順）：

| 対象 | 説明 |
|---|---|
| 参照切れ relationship | `from.table` または `to.table` が `tables` に存在しないrelationship |
| 参照切れ lineage | `from` または `to` が `tables` に存在しないlineage |
| 参照切れ layout エントリ | `layout` のキーが `tables` にも `domains` にも存在しない |
| 参照切れ domain.members | `domains[].members` に存在しないtable IDが含まれる |

「孤立テーブル」（relationshipにもlineageにも登場しないテーブル）は**デフォルトでは削除しない**（意図的にスタンドアロンであることが多いため）。`--include-isolated` フラグで検出対象に追加できるようにする。

---

### 決定5: 実装ファイル構成

```
src/lint.js    — lintルールの実装とCLI処理
src/prune.js   — pruneロジックとCLI処理
```

既存の `model-utils.js` の `readYaml()` / `resolveImports()` / `writeYaml()` を再利用する。新たな依存パッケージは追加しない。

## Risks / Trade-offs

- **lint-rules.yaml のスキーマ拡張** → 将来新しいルールを追加するたびにルールエンジンの拡張が必要。ただし各ルールは独立した関数として実装するため、追加コストは低い。
- **prune の `--write` による不可逆な変更** → dry-runのデフォルト化と出力の明確化で緩和。gitで管理しているため復元可能。
- **importを含むモデルの扱い** → `resolveImports()` を呼んでからチェックすることで、インポート先のテーブルも参照解決済みとして扱う。

## Open Questions

（なし）
