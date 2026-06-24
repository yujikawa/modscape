## Context

フル SDD ワークフロー（requirements → design → tasks → implement → archive）は、新規パイプライン設計や複雑な多テーブル変更には適しているが、カラム追加・テーブルリネームといった軽微なスキーマ変更には過剰なオーバーヘッドとなる。

特に requirements スキルは、ステークホルダーインタビュー・ビジネスコンテキスト深掘り・Acceptance Criteria の正式定義などを含むため、「このテーブルのこのカラムを追加したい」という明確な変更には不釣り合いに重い。

作り手が「これはライトで十分」と主観的に判断できる入口スキルが必要。

## Goals / Non-Goals

**Goals:**

- requirements → design → tasks の3フェーズを1スキル（`requirements-lite`）に圧縮する
- 生成されるフォルダ構成・ファイル構成はフル SDD と完全に同一にする（中身の密度のみ違う）
- `implement` → `archive` は既存スキルをそのまま再利用できるようにする
- Claude / Gemini / Codex の3エージェント版を同時に追加する

**Non-Goals:**

- 複雑な多テーブル変更・新規パイプライン設計（フル SDD を使う）
- `implement` や `archive` スキルの変更
- 自動判定による lite / フルの切り替え（作り手の主観的選択に委ねる）

## Decisions

### 決定1: ファイル構成はフル SDD と同一にする

**選択:** `spec.md`, `design.md`, `design/<id>.md`, `tasks.md`, `spec-config.yaml`, `spec-model.yaml` の全ファイルを生成する。ファイルを省略しない。

**理由:** `implement` は `tasks.md` と `design/<id>.md` を前提に動作する。`archive` はフォルダごと移動するだけ。ファイル構成が同一であれば、これらの既存スキルを無修正で再利用できる。また `modscape spec list` / `spec status` の表示も統一される。

**却下した代替案:** `spec.md` を省略する → `archive` や他のスキルが spec.md の有無を前提にしている可能性があるため却下。

---

### 決定2: 各ファイルの内容は薄くする（フォーマットは同じ、密度が違う）

| ファイル | フル SDD | requirements-lite |
|---------|---------|-------------------|
| `spec.md` | ステークホルダー・AC・ビジネスコンテキスト深掘り | what / why のみ（数行） |
| `design.md` | Affected Tables・downstream 分析・Design Decisions | mutations サマリのみ |
| `design/<id>.md` | 変換式・フィルター条件・検証SQL・テストパターン | カラム一覧と基本情報のみ |
| `tasks.md` | 複数フェーズ・複数タスク | 1フェーズ・最小限のタスク |
| `spec-model.yaml` | 同じ | 同じ |
| `spec-config.yaml` | 同じ | 同じ |

---

### 決定3: スキル名は `requirements-lite`

**理由:** `requirements` はフル SDD のワークフロー入口スキルであり、`requirements-lite` はその軽量版であることを名前から明示できる。`patch` のようなスタンドアロン系の名前は、後続に `implement` → `archive` が続くワークフロー入口であることが伝わりにくい。

---

### 決定4: スキルのフロー

```
/modscape:spec:requirements-lite <name>

1. 変更内容を一言収集（インタビューなし）
   - 何を変えるか（対象テーブル・変更の種類）
   - なぜ変えるか（一行の理由）

2. modscape spec new <name>
   → changes/<name>/ フォルダと spec-config.yaml を生成

3. 対象テーブルをモデルから読み取る
   → modscape table get <file> --id <id>

4. modscape extract → spec-model.yaml を生成

5. spec-model.yaml に mutations を適用
   → modscape table update / column add / column update 等

6. spec.md を生成（what / why のみ）

7. design.md を生成（mutations サマリのみ）

8. design/<id>.md を生成（カラム一覧・基本情報のみ）

9. tasks.md を自動生成（1フェーズ・最小限）

10. modscape spec set-phase <name> tasks

11. ユーザーに案内
    → `/modscape:spec:implement <name>` を実行してください
```

---

### 決定5: 3エージェント版を同時追加

AGENTS.md のルールに従い、Claude / Gemini / Codex の3バージョンを同時に追加する。`SPEC_SKILL_NAMES` にも `requirements-lite` を追加し、`modscape init` / `modscape update` でインストール・更新できるようにする。

## Risks / Trade-offs

- **`implement` が `design/<id>.md` の内容不足で誤ったコードを生成するリスク** → lite の `design/<id>.md` はカラム情報のみのため、複雑な変換式が必要なケースではフル SDD を使うべきであることをスキル内で明示する
- **ライト判断の主観性** → 「複雑と感じたらフル SDD に切り替える」指針をスキルの冒頭に記載する
