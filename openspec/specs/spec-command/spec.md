## Requirements

### Requirement: modscape spec サブコマンド名前空間
`modscape spec` は `dev` / `open` / `build` サブコマンドを束ねる親コマンドとして CLI に登録されなければならない（SHALL）。`src/index.js` において `program.command('spec')` として定義し、各サブコマンドをその配下に配置する（SHALL）。

#### Scenario: modscape spec をサブコマンドなしで実行するとヘルプが表示される
- **WHEN** `modscape spec` をサブコマンドなしで実行する
- **THEN** `spec dev`・`spec open`・`spec build` の使い方が表示される

#### Scenario: modscape spec dev が正しくルーティングされる
- **WHEN** `modscape spec dev <name>` を実行する
- **THEN** `src/spec.js` の `startSpecDevServer(name)` が呼び出される

#### Scenario: modscape spec open が正しくルーティングされる
- **WHEN** `modscape spec open` を実行する
- **THEN** `src/specs.js` の `openSpecBrowser()` が呼び出される

#### Scenario: modscape spec build が正しくルーティングされる
- **WHEN** `modscape spec build [outDir]` を実行する
- **THEN** `src/specs.js` の `buildSpecBrowser(outDir)` が呼び出される
