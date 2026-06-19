## Context

archive スキル（`src/templates/claude/spec/archive.md`）は `modscape merge --patch` を使って spec-model.yaml を main-model.yaml にマージする。パッチモード（`mergeModelsPatched`）はテーブル・リネージ・リレーションシップをすべて upsert（IDが一致すれば上書き、なければ追加）で処理するため、「削除」操作が存在しない。

この設計の結果、以下の操作を spec-model.yaml で表現できない：

- `int → factA` というリネージを `int → intA → factA` に置き換える（古い `int → factA` が残る）
- `tables_to_remove` でテーブルを消しても、そのテーブルが端点だったリネージが残る

## Goals / Non-Goals

**Goals:**
- `modscape merge --patch` に `--replace-owned-lineage` フラグを追加し、spec スコープ内のリネージを「置換」モードでマージできるようにする
- `tables_to_remove` テーブルが持つリネージを archive スキルが自動クリーンアップする
- spec-config.yaml に `lineage_to_remove` を追加し、自動ロジックでカバーできないエッジケースの脱出口を提供する
- claude / codex / gemini の archive スキルテンプレートすべてに反映する

**Non-Goals:**
- リネージのカスケード削除（テーブル削除に CLI が自動連動する）は行わない
- relationships の同様の置換はスコープ外（今回は lineage のみ）
- UI（ビジュアルエディタ）側の変更はスコープ外

## Decisions

### 決定1: 「within-scope lineage replace」を merge.js に実装する

**採用:** `mergeModelsPatched()` に `replaceOwnedLineage` オプションを追加する。

処理ロジック：
```
1. patch YAML から owned tables を収集（isImported !== true なテーブルの id）
2. base の lineage を走査し、from と to の両方が owned tables に含まれるエントリを削除
3. lineageIndex を再構築
4. 通常の upsert マージを実行（patch の lineage を追加）
```

**却下した代替案A: スキル側で個別に `modscape lineage remove` を呼ぶ**
- N件のリネージに対してN回の CLI 呼び出しが必要で遅い
- 中断時に中途半端な状態になる危険がある

**却下した代替案B: spec-model.yaml に `_delete: true` マーカーを追加**
- spec-model.yaml のフォーマット変更が必要
- ビジュアルエディタが `_delete` フィールドを解釈できない

**境界またぎ（片方だけが owned）を保持する理由:**
```
例: other_table → int_table → intA → factA → mart → consumer_table
                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                  owned scope (spec-model.yaml)

other_table → int_table  は境界またぎ（other は owned でない）→ 保持
mart → consumer_table    は境界またぎ（consumer は owned でない）→ 保持
int_table → factA        は within-scope → 削除（spec-model で置換）
```

### 決定2: `tables_to_remove` のリネージクリーンアップをスキル側で行う

`tables_to_remove` に列挙されたテーブルは「消滅」するため、そのテーブルが端点（`from` または `to`）になっているリネージは全て孤立する。

archive スキルの Step 2.5 を拡張し、テーブル削除前に：
```bash
modscape lineage list <master>.yaml --json
# → from or to が tables_to_remove に含まれるエントリを特定
modscape lineage remove <master>.yaml --id <lineage-id>
```
を実行する。

within-scope replace（決定1）とセマンティクスが異なる：
- within-scope replace: 両端が owned → スコープ内リネージの「置換」
- tables_to_remove クリーンアップ: 片端でも削除対象テーブル → テーブル消滅による「孤立リネージの掃除」

### 決定3: `lineage_to_remove` を spec-config.yaml に追加する

```yaml
# spec-config.yaml
main_yamls:
  - path: model.yaml
    tables: [...]
tables_to_remove: []
lineage_to_remove:        # 追加: 明示削除リスト（自動ロジックで救えないケース向け）
  - lin-xxx-yyy
```

- 決定1・2で大部分のケースはカバーされるが、owned でないテーブル間のリネージを手動で消したいケースに対応
- 後方互換（フィールド未設定時は従来どおり動作）

### 決定4: 3テンプレートすべてを更新する

`src/templates/claude/spec/archive.md`、`src/templates/codex/modscape-spec-archive`、`src/templates/gemini/modscape-spec-archive` は内容が連動しているため、同一の変更を全ファイルに反映する。

## Risks / Trade-offs

**[Risk] owned テーブルの isImported 判定が不正確な場合、想定外のリネージが削除される**
→ Mitigation: `merge --patch --replace-owned-lineage` はドライランプレビューを archive スキル側で表示し、ユーザー確認を得てから実行する（既存の dry-run サマリーに「削除予定リネージ」を追記）

**[Risk] spec-model.yaml に isImported が付いていないコンテキストテーブルが存在すると、そのテーブル絡みのリネージが意図せず置換対象になる**
→ Mitigation: archive スキルの `modscape extract` ステップで既に `isImported` テーブルをフィルタしているため、owned テーブルの集合は正しく限定される

**[Trade-off] lineage_to_remove は手動記入が必要**
→ 決定1・2で自動化できないケースにのみ必要。通常のリファクタリングでは不要なはず。

## Open Questions

- `modscape lineage list` に `--from <id>` や `--to <id>` フィルタを追加すると Step 2.5 の実装が簡潔になる。今回の実装スコープに含めるか？
  → 含める方向（lineage list に `--involves <tableId>` フィルタを追加）
