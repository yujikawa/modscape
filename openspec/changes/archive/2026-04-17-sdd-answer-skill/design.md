## Context

`modscape spec answer` CLI コマンドは `questions.js` の `answerQuestion` 関数を呼び出し、`questions.md` の該当 Q-NNN を `- [x]` に変更して `**A:** <text>` を追記する単純な操作を行う。

この操作自体は AI がファイルを直接編集することと等価であり、CLI である必然性はない。また CLI では「回答が曖昧かどうか」を判断する知性がなく、そのまま書き込むだけになる。

`resolveChangeName` のロジック（アクティブな change が 1 つなら name 省略可）は AI スキル側で同等の動作を実装する（`questions.md` が見つかる change を自動推定する）。

## Goals / Non-Goals

**Goals:**
- CLI `modscape spec answer` と `src/operations/questions.js` を削除する
- `/modscape:spec:answer` AI スキルを新規作成する
- スキルが追加ヒアリングで回答を整理し、`questions.md` に記録する
- 回答の設計への影響を判断して次のアクションを提案する

**Non-Goals:**
- `questions.md` のフォーマット変更（既存フォーマットを維持）
- 複数の Q-NNN を一括回答する機能（1回の呼び出しで1質問が基本）

## Decisions

### スキルの対話フロー

**決定**: 以下のフローで動作する。

```
1. Q-NNN の質問文を表示
2. ユーザーが回答を入力
3. AI が回答を評価:
   - 明確 → そのまま記録
   - 曖昧・不完全（例: 「たぶん」「要確認」「わからない」など）→ 追加ヒアリング
   - 「回答できない / 後で調べる」→ questions.md に仮定として記録
4. 整理した回答を questions.md に記録
5. 設計への影響を判断して次のアクション提案
```

**曖昧と判断する基準:**
- 「たぶん」「おそらく」「〜のはず」など不確かな表現
- 数値や条件が具体的でない（「大体」「なるべく」など）
- 「後で確認」「わからない」→ 仮定として扱う

### 設計への影響判断

**決定**: 回答後に以下を確認する。

- `design.md` が存在し、回答内容が `## Affected Tables` や `## Design Decisions` に影響する場合 → `/modscape:spec:design <name>` 再実行を提案
- `spec.md` の AC-NNN に影響する場合 → `/modscape:spec:amend <name>` を提案
- 影響なし（参考情報として記録するだけ）→ 「引き続き実装を進めてください」

### questions.md への記録フォーマット

既存の `answerQuestion` 関数と同じフォーマットを維持する：

```markdown
- [x] **Q-001** <question text>
  **Assumption:** <if proceeded with assumption>
  **A:** <整理した回答>
```

追加ヒアリングがあった場合は、最終的に整理した回答を `**A:**` に書く（ヒアリングの過程は残さない）。

### CLI の削除範囲

- `src/index.js` から `spec answer` サブコマンドの登録を削除
- `src/operations/questions.js` の `answerQuestion` / `resolveChangeName` / `listActiveChanges` を削除
- `resolveChangeName` は `src/index.js` の他のコマンドでも使われている可能性があるため確認が必要

## Risks / Trade-offs

- **既存ユーザーの CLI 利用が壊れる**: `modscape spec answer` を使っていたユーザーには breaking change。ただし利用者は少なく、AI スキルのほうが UX が良いため許容。
- **`resolveChangeName` の共有**: 他のコマンドが `questions.js` から import している場合は、削除前に確認して移動が必要。
