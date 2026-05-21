## MODIFIED Requirements

### Requirement: Q-NNN への対話的回答記録ができる
AIスキル `/modscape:spec:answer <name> <id>` は、指定した Q-NNN の質問をユーザーに提示し、回答を対話的に収集して `changes/<name>/questions.md` に記録しなければならない（SHALL）。

スキルは以下を行わなければならない（SHALL）:
- 指定された Q-NNN の質問文と現在の状態（未回答 / 仮定）を表示する
- ユーザーの回答を受け取り、曖昧・不完全な場合は追加ヒアリングを行う
- 整理した回答を `questions.md` の該当エントリに `**A:** <回答>` として追記し、チェックを `[x]` にする
- **回答内容が `design.md` の設計判断（テーブル設計・カラム定義・JOIN 条件・変換式等）に影響するかを判断し、影響する場合は `design.md` の該当セクションを更新してから `questions.md` のステータスを更新する**

**design.md 更新の必須化:**
スキルは `questions.md` に回答を記録する前に、以下を行わなければならない（SHALL）:
1. 回答内容が `design.md` の設計に影響するかを判断する
2. 影響する場合 → `design.md` の該当セクション（`## Design Decisions` または `## Implementation Details`）を更新し、波及確認レポートに「design.md: ✅ 更新済み」と記載する
3. 影響しない場合 → 波及確認レポートに「design.md: ✅ 影響なし」と記載する
4. その後 `questions.md` のステータスを更新する

スキルは `<name>` が省略された場合、アクティブな change を自動推定しなければならない（SHALL）。

**曖昧と判断する基準（追加ヒアリングが必要）:**
- 「たぶん」「おそらく」「〜のはず」など不確かな表現
- 数値・条件が具体的でない（「大体」「なるべく」など）

**回答できない場合の処理:**
- 「わからない」「後で確認」など → 仮定として記録し、`**Assumption:**` 行を更新する

#### Scenario: 回答が design.md に影響する場合に design.md を先に更新する
- **WHEN** Q-001「`amount` カラムの型は？」に対して「DECIMAL(18,2) です」と回答する
- **THEN** スキルは `design.md` の `## Implementation Details` の該当テーブルセクションを更新してから `questions.md` の status を answered に変更し、波及確認レポートを出力する

#### Scenario: 回答が design.md に影響しない場合は影響なしと記録する
- **WHEN** Q-002「データオーナーは誰ですか？」に対して「営業チームです」と回答する
- **THEN** スキルは `questions.md` を更新し、波及確認レポートに「design.md: ✅ 影響なし」と記載する

#### Scenario: 明確な回答を渡すとそのまま記録される
- **WHEN** ユーザーが明確な回答（「`amount` カラムは DECIMAL(18,2) です」）を入力する
- **THEN** 追加ヒアリングなしで `design.md` と `questions.md` が更新される

#### Scenario: 曖昧な回答には追加ヒアリングを行う
- **WHEN** ユーザーが「たぶん DECIMAL だと思います」と入力する
- **THEN** AIは「精度（桁数）はわかりますか？」など具体的な追加質問を行い、整理した回答を記録する

#### Scenario: 回答できない場合は仮定として記録する
- **WHEN** ユーザーが「わからない、後で確認します」と入力する
- **THEN** `questions.md` の `**Assumption:**` 行に「未確認のまま進む」旨が記録され、チェックは `[ ]` のまま保持される
