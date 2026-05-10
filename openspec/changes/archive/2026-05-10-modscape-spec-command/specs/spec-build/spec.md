## ADDED Requirements

### Requirement: modscape spec build — 恒久 spec ブラウザの静的出力
`modscape spec build [outDir]` は `.modscape/specs/` をスキャンし、spec ブラウザを静的 HTML として指定ディレクトリ（デフォルト: `dist/specs`）に出力しなければならない（SHALL）。

**出力構成（SHALL）:**
```
<outDir>/
  index.html                    ← spec ブラウザ（vanilla JS でナビゲーション）
  <model-slug>/
    <table-id>.html             ← .modscape/specs/<model-slug>/<table-id>.html をコピー
    <table-id>.md               ← .modscape/specs/<model-slug>/<table-id>.md をコピー
```

`index.html` は vanilla JS でテーブル一覧を左ペインに表示し、選択時に右ペインの iframe src を切り替える。API サーバー不要で単独で動作しなければならない（SHALL）。

#### Scenario: spec build で dist/specs/ が生成される
- **WHEN** `modscape spec build` を実行する
- **THEN** `dist/specs/index.html` と各 spec ファイルのコピーが出力される

#### Scenario: カスタム出力ディレクトリを指定できる
- **WHEN** `modscape spec build ./public/specs` を実行する
- **THEN** `./public/specs/` に出力される

#### Scenario: .modscape/specs/ が存在しない場合はエラーを表示する
- **WHEN** `.modscape/specs/` が存在しない状態で `modscape spec build` を実行する
- **THEN** エラーメッセージを表示して終了する
