## Context

現在の CLI コマンド構成：

```
modscape dev <paths...>          ← YAML ビジュアライザ
modscape dev --spec <name>       ← SDD 作業中変更のビューア（specMode）
modscape build <paths...>        ← YAML ビジュアライザの静的ビルド
```

`modscape dev --spec` の実装は `src/dev.js` の `startDevServer()` に `specName` 引数として同居しており、通常の dev モードと spec モードが一つの関数に混在している。また、per-table HTML spec を ContextPanel に埋め込む試みは `iframe 404`・`blob URL` などの複雑さを招いており、方針を変えて専用ブラウザコマンドで扱う。

## Goals / Non-Goals

**Goals:**
- `modscape spec` を名前空間として `dev` / `open` / `build` サブコマンドを提供する
- `modscape dev --spec` を `modscape spec dev` に移行し、`dev` コマンドを YAML ビジュアライザ専用にする
- `modscape spec open` で `.modscape/specs/` をブラウズする軽量 dev server を追加する
- `modscape spec build` で spec ブラウザを静的 HTML として出力する
- ContextPanel と `modscape build` から spec HTML 埋め込みを除去し、シンプルな構成に戻す

**Non-Goals:**
- `modscape spec open` に React/Vite を使わない（サーバーレンダリング HTML で十分）
- ContextPanel の Specs タブ自体は残す（MD テキスト表示は維持）
- Gemini / Codex 版スキルファイルの同期（Claude Code 版のみ更新）

## Decisions

**D-1: `spec` サブコマンドの実装を `src/spec.js` と `src/specs.js` に分離する**

- `src/spec.js` — `modscape spec dev <name>` の実装。`dev.js` から specMode ロジックを切り出す
- `src/specs.js` — `modscape spec open` / `modscape spec build` の実装
- `src/index.js` で `program.command('spec')` を親コマンドとして登録し、その下に `dev` / `open` / `build` を配置する

**D-2: `modscape spec open` のブラウザ UI はサーバーレンダリング HTML**

`.modscape/specs/` 配下のファイルをスキャンし、モデルスラグ別テーブル一覧を左ペイン、HTML spec の iframe を右ペインに持つ 2 カラムレイアウトを `res.send(html)` で配信する。Vite/React は不要。`/api/table-spec/:slug/:tableId` エンドポイントで個別 spec を配信する（`dev.js` から `specs.js` へ移管）。

**D-3: `modscape spec build` は `dist/specs/` にファイルをコピー＋index.html を生成**

```
dist/specs/
  index.html                        ← spec ブラウザ（静的、JS でナビゲーション）
  1-retail-analytics/
    fct_orders.html
    mart_daily_revenue.html
  2-conformed-dims/
    dim_dates.html
```

index.html はシンプルな vanilla JS で左ペインのテーブル一覧をレンダリングし、選択時に右ペインの iframe の src を切り替える。

**D-4: ContextPanel の `TableSpecSection` は MD テキスト表示のみに戻す**

`specIsHtml` フラグと iframe 分岐を除去。`TableSpecEntry` は `{ spec?: string }` のみ（`specIsHtml` を削除）。`/api/table-spec/` エンドポイントは `dev.js` から削除し `specs.js` に移管する。

**D-5: `modscape build` の tableSpecs 注入を除去**

`build.js` を per-table spec 埋め込み前の形に戻す（`tableSpecs` オブジェクトの生成と注入を削除）。

## Risks / Trade-offs

- **`modscape dev --spec` の破壊的変更** → v3.4.0 で導入されたばかりのため影響範囲は小さい。CHANGELOG と README で案内する。
- **`modscape spec open` の UI が簡素** → React を使わないため機能は限定的だが、spec 閲覧に必要な最低限（一覧＋HTML 表示）は満たせる。将来的に拡充する余地は残す。

## Migration Plan

1. `src/spec.js` を新規作成し `dev.js` の specMode ロジックを移植する
2. `src/specs.js` を新規作成し `spec open` / `spec build` を実装する
3. `src/index.js` に `modscape spec` コマンド群を登録する
4. `src/dev.js` から `--spec` フラグと `/api/table-spec/` エンドポイントを削除する
5. `src/build.js` から tableSpecs 注入コードを除去する
6. `ContextPanel.tsx` から iframe 分岐を除去し、`useStore.ts` / `schema.ts` から `specIsHtml` を削除する
7. `npm run build-ui` でフロントエンドを再ビルドする
8. README / CHANGELOG を更新する

## Open Questions

なし
