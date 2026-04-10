## Context

現在の `modscape extract` は `--tables <ids>` で明示指定したテーブルIDのみを抽出する。lineage エントリは「両端がともに指定IDリストに含まれる場合のみ」出力されるため、下流テーブルを自動収集する機能がない。

SDDの design スキルでは、AIが `modscape lineage list` を手動で読んで下流テーブルを推定してから `--tables` に並べる運用になっているが、lineage が深い・複数YAMLにまたがる場合は漏れが起きやすい。

## Goals / Non-Goals

**Goals:**
- `modscape extract --with-downstream` で指定テーブルから全下流テーブルを再帰収集して抽出できる
- 複数の入力YAMLを渡したとき、全YAMLの lineage を合成して1つのグラフとして扱う
- SDD design スキルがこのフラグを使い、Affected Tables を抽出結果から自動導出できる

**Non-Goals:**
- 上流トラバーサル（`--with-upstream`）は今回のスコープ外
- 深さ制限オプション（`--depth N`）は今回のスコープ外
- `--with-downstream` フラグのないときの既存動作は変えない

## Decisions

### 1. グラフ構築を extract.js 内部で行う

**決定:** 全入力YAMLの `lineage` セクションをメモリ上で合成し、隣接リスト（`Map<string, string[]>`）として管理する。BFS で起点IDから下流を再帰収集する。

**理由:** 外部ライブラリを使わず、`js-yaml` で読んだデータをそのまま使えるシンプルな実装で十分。lineage グラフは有向非巡回グラフ（DAG）であることを前提とする（循環は警告のみで処理継続）。

**代替案:** 別コマンド `modscape impact` として切り出す案もあったが、extract の一部として統合するほうがスキルからの呼び出しが1コマンドで済み、`--record` との連携もそのまま使える。

### 2. 下流収集後は通常の抽出フローに流す

**決定:** `--with-downstream` で収集した全IDを `tableIds` リストに追加し、以降は既存の抽出ロジックをそのまま通す。

**理由:** relationships / lineage / annotations / domains / layout の抽出ロジックは再利用でき、重複実装を避けられる。

### 3. テーブルのソースYAMLの特定

**決定:** 下流テーブルが属するソースYAMLは「そのテーブルが実際に存在したファイル」を `--record` 時に記録する（既存の `--record` ロジックを拡張）。

**理由:** `spec-config.yaml` の `master_yamls[].tables` に正しいソースが記録されないと、archive フェーズで本番YAMLへの書き戻しができなくなる。

### 4. SDD design スキルの変更方針

**決定:** 初回抽出コマンドを以下に変更する：

```bash
# Before
modscape extract <master1>.yaml --tables <id1>,<id2> --output spec-model.yaml --record spec-config.yaml

# After
modscape extract <master1>.yaml <master2>.yaml ... \
  --tables <修正対象ID> \
  --with-downstream \
  --output spec-model.yaml \
  --record spec-config.yaml
```

`spec-config.yaml` の全 `master_yamls[].path` を入力として渡す。Affected Tables の Direct / Downstream 分類は「`--tables` で指定したID = Direct、収集で追加されたID = Downstream」とする。

## Risks / Trade-offs

- **循環lineageへの対処** → BFS で訪問済みセットを管理し無限ループを防ぐ。循環が検出された場合は `⚠️ Circular lineage detected` を警告出力して処理継続。
- **大規模グラフでの性能** → lineage エントリ数が数千を超えるモデルでBFS が遅くなる可能性があるが、Modscape のユースケースでは問題になるサイズではない。
- **spec-config.yaml に未登録のYAMLに下流テーブルが存在する場合** → `--record` 時にそのファイルパスを新エントリとして自動追加する。
