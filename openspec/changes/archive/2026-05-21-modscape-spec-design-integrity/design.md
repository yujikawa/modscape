## Context

`modscape:spec` のスキル群は `spec-model.yaml` を SSOT として設計・実装を進める SDD フローを提供しているが、現状では以下の問題がある。

1. **implement スキルでの直接編集問題**: `spec:implement` の実行中にユーザーから修正指摘を受けると、AIが生成済みの dbt/SQL ファイルを直接書き換えるケースが頻発する。結果として `spec-model.yaml` と生成コードが乖離し、設計書が現実を反映しなくなる。

2. **設計書ロールの曖昧さ**: `spec.md` と `design.md` の責務が不明確で、実装に必要な詳細（検証SQL、変換式）をどちらに書くか定まっていない。理想は「`design.md` を読めば実装できる」状態だが、現状の `design.md` フォーマットはその詳細を書く場所を持っていない。

3. **answer スキルの sync 漏れ**: `spec:answer` で質問に回答しても `design.md` への反映が明示的でなく、設計書とのsyncが途切れる。

4. **tasks.md の上書き問題**: `spec:tasks` を再実行すると既存の完了済みタスク（`[x]`）が消える。設計変更ループで `spec:design` → `spec:tasks` を踏む際に進捗が失われるリスクがある。

## Goals / Non-Goals

**Goals:**
- `spec:implement` における生成ファイルへの直接編集を禁止し、`design.md → spec-model.yaml → 再生成` のプロトコルを強制する
- 修正後にタスクのチェックを外すかどうかユーザーが選択できるようにする
- `design.md` フォーマットに実装詳細（検証SQL・変換式・テストパターン）を書けるセクションを追加する
- `spec.md` を背景・動機 + 抽象的な受け入れ条件のみにシンプル化する
- `spec:answer` で回答した内容を `design.md` に反映するステップを必須化する
- `spec:tasks` 再実行時に既存進捗をマージして差分確認フローを提供する

**Non-Goals:**
- `tasks.md` と進捗状態（progress）の構造分離（別 change で検討）
- スキルの CLI コマンド体系の変更
- `spec-model.yaml` のスキーマ変更

## Decisions

### 1. implement スキル: 直接編集の禁止と design.md 優先プロトコル

**変更内容**: 既存の「軽微な修正 / 設計変更」分岐を維持しつつ、以下を追加する。

- 冒頭に「生成済みファイル（dbt model, SQL等）への直接編集を禁止する」ルールを明記
- 軽微な修正フローを以下の順序に改定:
  1. `design.md` の該当テーブルセクションを更新（先に設計書を直す）
  2. `spec-model.yaml` を mutation CLI で更新
  3. 変更内容をユーザーに見せる
  4. 「このタスクを未完了に戻して実装し直しますか？」とユーザーに確認
  5. 確認後に SQL を再生成

**タスクチェック戻し確認の設計**:
```
⚠️ 修正が完了しました。

design.md を更新しました: <変更概要>
spec-model.yaml を更新しました: <変更概要>

このタスクを未完了（[ ]）に戻して実装し直しますか？
- はい → タスクを [ ] に戻し、SQL を再生成します
- いいえ → このまま次のタスクに進みます（修正は次回のビルドに反映されます）
```

**理由**: 修正の大きさによって「タスクを戻す」かどうかは文脈依存であり、AI が自動判定すると誤りが生じやすい。ユーザーが判断する方が安全。

### 2. design.md フォーマット: 実装詳細セクションの追加

**変更内容**: `design-format.md`（または相当のフォーマット定義ファイル）に以下のセクションを追加する。

```markdown
## Implementation Details

### <table-id>
- **変換式**: `expression: CAST(raw_amount AS DECIMAL(18,2))`
- **フィルター条件**: `WHERE status != 'cancelled'`
- **検証SQL**: `SELECT COUNT(*) FROM <table> WHERE amount IS NULL` → 0件であること
- **テストパターン**: PK の unique + not_null, FK の referential integrity
```

**理由**: 現状の `design.md` は設計判断の記録（Design Decisions）に留まり、実装者が参照するコード水準の詳細を書く場所がない。実装詳細を `design.md` に集約することで「`design.md` を読めば実装できる」状態を実現する。

### 3. spec.md フォーマット: シンプル化

**変更内容**: requirements スキルの spec.md 生成フォーマットを以下の構成に絞る。

```markdown
## Background
なぜこの変更が必要か（動機・背景）

## Acceptance Criteria
- AC-001: ...（抽象的な条件のみ）
- AC-002: ...
```

WHEN/THEN シナリオや検証 SQL は `design.md` の責務とする。AC は「何が満たされるべきか」を述べるもので、「どう確認するか」は書かない。

**理由**: 現状の spec.md は詳細な WHEN/THEN シナリオを含み、design.md との役割重複が生じていた。役割を分離することで設計書の二重管理を解消する。

### 4. answer スキル: design.md 更新の必須化

**変更内容**: 回答記録後に以下のステップを追加する。

1. 回答内容が design.md の設計判断（テーブル設計・カラム定義・JOIN条件等）に影響するかを判断
2. 影響する場合 → `design.md` の該当セクションを更新し、更新内容を波及確認レポートに記載
3. 影響しない場合 → 波及確認レポートに「design.md: ✅ 影響なし」と記載

**理由**: 現状は回答が `questions.md` に記録されるだけで `design.md` への反映が任意になっており、設計書と質問回答がsyncしない。

### 5. tasks スキル: マージ挙動と差分確認

**変更内容**: `tasks.md` が既存かつ完了済みタスク（`[x]`）がある場合の挙動を変更する。

```
tasks.md が存在しない → そのまま生成（既存動作）
tasks.md が存在し、[x] が 0 件 → 上書き（既存動作）
tasks.md が存在し、[x] が 1 件以上 → マージ + 差分表示 + 確認

差分表示フォーマット:
  追加: [ ] intermediate_orders（新規テーブル）
  維持: [x] stg_orders, [x] stg_customers
  削除: fct_orders_v1（spec-model.yaml から除去済み）

続けますか？ [y/N]
```

マージルール:
- 旧 `[x]` + 新 `spec-model.yaml` に存在 → `[x]` 維持
- 新 `spec-model.yaml` に追加 → `[ ]` で追加
- `spec-model.yaml` から削除されたテーブル → tasks.md からも除去

**理由**: 設計変更ループ（`spec:design` 再実行後に `spec:tasks` 再実行）での既存進捗の消失を防ぐ。誤って中途実行した場合にも確認フローで気づける。

## Risks / Trade-offs

- **design.md の肥大化**: Implementation Details セクションを追加すると `design.md` が長くなる。テーブル数が多い change では見づらくなる可能性がある → 軽減策: 各テーブルのセクションを折りたたむ命名規則（`### <table-id>`）を明示し、必要最小限の記述に留める
- **タスクチェック戻し確認のノイズ**: 修正のたびに確認が発生するため、小さな修正が多い場合に煩雑に感じる可能性がある → 軽減策: 「いいえ」を選んだ場合も修正自体は完了しているため、次のビルドに反映される旨を明記して心理的障壁を下げる
- **マージロジックの複雑性**: タスクIDの同一性判定（テーブルIDで一致とする）に曖昧さが残る可能性 → 軽減策: テーブルIDをタスクの識別キーとして明示し、IDが変わった場合は削除 + 追加として扱う
