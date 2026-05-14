## ADDED Requirements

### Requirement: SDD 作業フォルダ内の全アーティファクトの整合性を一発チェックできる
`/modscape:spec:validate <name>` は `.modscape/changes/<name>/` 内のすべての SDD アーティファクトを横断して整合性チェックを行い、矛盾・抜け・ズレをカテゴリ別に報告しなければならない（SHALL）。自動修正は行わず、報告と修正ヒントの提示のみを行わなければならない（SHALL）。

チェック対象ファイルは常に `.md` 拡張子のファイルとする（HTMLモードは廃止）。

チェックカテゴリ：

**A. spec ↔ design の整合**
- `spec.md` に記載されたテーブルIDが `design.md` の Affected Tables に存在するか
- `design.md` の `### Requires Model Change` エントリが `tasks.md` に対応タスクとして存在するか

**B. design ↔ spec-model.yaml の整合**
- `design.md` の Direct Impact テーブルIDが `spec-model.yaml` に存在するか
- `spec-model.yaml` に存在するテーブルIDが `design.md` の Affected Tables のいずれかに分類されているか

**C. design ↔ tasks の整合**
- `design.md` の Direct Impact テーブルごとに対応する実装タスクが `tasks.md` に存在するか

**D. questions ↔ design の整合（MDモードのみ）**
- `questions.md` の未解決Q&A（`- [ ]`）が `design.md` の仮定（`**Assumption:**` 行）として記録されているか
