## ADDED Requirements

### Requirement: 軽微なスキーマ変更を1スキルで完結させる

AIスキル `/modscape:spec:requirements-lite` は、カラム追加・テーブルリネーム・型変更など作り手がライトと判断した軽微なスキーマ変更に対し、requirements → design → tasks の3フェーズを1回の実行で完結させなければならない（SHALL）。

スキルはフル SDD の `/modscape:spec:requirements` の代替として機能し、`/modscape:spec:implement` → `/modscape:spec:archive` へ続くワークフローの入口でなければならない（SHALL）。

#### Scenario: スキルを呼び出すと変更内容の収集から tasks.md 生成までが1回で完了する
- **WHEN** ユーザーが `/modscape:spec:requirements-lite <name>` を実行する
- **THEN** スキルは変更内容（対象テーブル・変更の種類・理由）を収集し、`spec.md`・`design.md`・`design/<id>.md`・`tasks.md`・`spec-model.yaml`・`spec-config.yaml` を生成して終了する

#### Scenario: 実行後に implement へ誘導する
- **WHEN** スキルがすべてのファイルを生成し終えた
- **THEN** スキルは「`/modscape:spec:implement <name>` を実行してください」と案内する

---

### Requirement: フル SDD と同一のフォルダ・ファイル構成を生成する

スキルが生成するフォルダ構成およびファイルの種類はフル SDD と完全に同一でなければならない（SHALL）。ファイルを省略してはならない（SHALL NOT）。

生成するファイル:
- `.modscape/changes/<name>/spec.md`
- `.modscape/changes/<name>/spec-config.yaml`
- `.modscape/changes/<name>/spec-model.yaml`
- `.modscape/changes/<name>/design.md`
- `.modscape/changes/<name>/design/<id>.md`（変更対象テーブルごとに1ファイル）
- `.modscape/changes/<name>/tasks.md`

#### Scenario: 生成されたフォルダを modscape spec list が認識する
- **WHEN** `/modscape:spec:requirements-lite <name>` が完了する
- **THEN** `modscape spec list` の出力に `<name>` が表示される

#### Scenario: implement が追加作業なしに動作する
- **WHEN** `/modscape:spec:requirements-lite <name>` 完了後に `/modscape:spec:implement <name>` を実行する
- **THEN** implement は `tasks.md` と `design/<id>.md` を読み取り、追加の入力なしにコード生成を開始する

---

### Requirement: 各ファイルの内容はフル SDD より簡素にする

スキルが生成するファイルの内容はフル SDD より簡素でなければならない（SHALL）。ただし、フォーマット（セクション構成）はフル SDD のものに準拠しなければならない（SHALL）。

| ファイル | 生成される内容 |
|---------|--------------|
| `spec.md` | `## Background`（what / why のみ、AC なし、ステークホルダーなし） |
| `design.md` | mutations サマリ、Affected Tables（downstream 分析なし） |
| `design/<id>.md` | カラム一覧と基本情報のみ（変換式・検証SQL は任意） |
| `tasks.md` | 1フェーズ・変更対象テーブルのみ |

#### Scenario: spec.md に Acceptance Criteria が含まれない
- **WHEN** `/modscape:spec:requirements-lite` が `spec.md` を生成する
- **THEN** `spec.md` には `## Background` セクションのみが含まれ、`## Acceptance Criteria` セクションは含まれない

#### Scenario: design.md に downstream 分析が含まれない
- **WHEN** スキルが `design.md` を生成する
- **THEN** `design.md` の `## Affected Tables` には直接変更対象テーブルのみが記載され、downstream テーブルの分析は行われない

#### Scenario: tasks.md が1フェーズで生成される
- **WHEN** スキルが `tasks.md` を生成する
- **THEN** `tasks.md` はフェーズが1つだけの最小限の構成となり、変更対象テーブルのタスクのみが含まれる

---

### Requirement: スキルを Claude / Gemini / Codex の3エージェント版で提供する

`requirements-lite` スキルは Claude Code・Gemini・Codex の3エージェントバージョンを同時に提供しなければならない（SHALL）。

ファイルパス:
- `src/templates/claude/spec/requirements-lite.md`
- `src/templates/gemini/modscape-spec-requirements-lite/SKILL.md`
- `src/templates/codex/modscape-spec-requirements-lite/SKILL.md`

スキル名は `src/template-files.js` の `SPEC_SKILL_NAMES` に追加しなければならない（SHALL）。

#### Scenario: modscape update でスキルがインストールされる
- **WHEN** ユーザーが `modscape update` を実行する
- **THEN** `requirements-lite` スキルが `.modscape/skills/` 以下にインストールまたは更新される

#### Scenario: 3エージェント版の動作が同等である
- **WHEN** Claude・Gemini・Codex それぞれで `/modscape:spec:requirements-lite` を実行する
- **THEN** 生成されるファイル構成および各ファイルの主要セクションが同等である

---

### Requirement: フル SDD との使い分けをスキル冒頭で案内する

スキルはその冒頭に、ライトパターンが適切なケースとフル SDD を使うべきケースの使い分けを明示しなければならない（SHALL）。

#### Scenario: 変更が複雑だとユーザーが気づいた場合にフル SDD を提案する
- **WHEN** ユーザーが複数テーブルへの影響・downstream への大きな変更・ビジネス要件の整理が必要なケースを説明した場合
- **THEN** スキルは「このケースはフル SDD（`/modscape:spec:requirements`）を使うことをお勧めします」と案内して終了する
