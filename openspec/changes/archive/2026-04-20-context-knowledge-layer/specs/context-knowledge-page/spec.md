## ADDED Requirements

### Requirement: `context.html`としてknowledge pageを独立したHTMLページで提供する

`modscape build`は既存の`index.html`（graph view）に加え、`context.html`（knowledge page）を`visualizer-dist/`に出力する。`modscape dev`では`/context.html`でアクセスできる。

knowledge pageはgraph viewとは独立した別ページとして動作し、相互ナビゲーションは不要。

#### Scenario: buildコマンドでcontext.htmlが出力される
- **WHEN** `modscape build <paths...>`を実行する
- **THEN** `visualizer-dist/context.html`が生成される

#### Scenario: devサーバーでcontext.htmlにアクセスできる
- **WHEN** `modscape dev <paths...>`を実行中に`/context.html`にブラウザでアクセスする
- **THEN** knowledge pageが表示される

---

### Requirement: knowledge pageはdecisions・questions・per-tableのspec/Q&Aを統合表示する

knowledge pageは以下の情報を1ページで閲覧できる:

**Project-level（_context.yamlから）**
- Decisions一覧: id, summary, rationale（あれば）, date, change
- Questions一覧: id, question, answer（あれば）, date, change。回答済み/未回答を区別して表示

**Table-level（specs/<table-id>/から）**
- テーブル一覧とその各spec.md内容
- 各テーブルのquestions.md内容

#### Scenario: decisionsが表示される
- **WHEN** `_context.yaml`にdecisionsが存在する状態でknowledge pageを開く
- **THEN** decisions一覧がsummaryとともに表示される

#### Scenario: 回答済みquestionと未回答questionを区別して表示する
- **WHEN** questionsにanswerありとなしが混在する
- **THEN** 回答済みはanswerも表示され、未回答は視覚的に区別された状態で表示される

#### Scenario: テーブル別のspec.mdが表示される
- **WHEN** `.modscape/specs/<table-id>/spec.md`が存在する
- **THEN** そのテーブルのspecセクションにMarkdownレンダリングされた内容が表示される

#### Scenario: specsが存在しない場合はempty stateを表示する
- **WHEN** `.modscape/specs/`が空またはdecisions/questionsが空
- **THEN** エラーにならず「No context recorded yet.」のようなempty stateを表示する

---

### Requirement: graph viewからcontext関連の表示要素を削除する

graph viewはデータモデルの可視化に集中させる。以下の要素を削除する:
- RightPanel > DecisionsTab
- DetailPanel > Decisionsタブ（relatedDecisionsロジック含む）
- DetailPanel > ❓バッジ（open_questions表示）
- useStoreのcontextData読み込みロジック
- schema.tsのContextYaml / ContextTableEntry / ContextDecision型

#### Scenario: graph viewにDecisionsタブが存在しない
- **WHEN** graph viewでテーブルを選択してDetailPanelを開く
- **THEN** Decisionsタブが表示されない

#### Scenario: graph viewの❓バッジが表示されない
- **WHEN** `_context.yaml`にopen questionsが存在する場合でもgraph viewを開く
- **THEN** テーブルに❓バッジは表示されない
