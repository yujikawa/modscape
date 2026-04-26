---
name: modscape-spec-note
description: Capture free-form knowledge (from a conversation, Slack message, or meeting) and append it to one or more permanent table spec files (specs/<table-id>/spec.md). Runs outside the SDD implementation workflow — no active change required.
---

# Spec Note

Capture free-form knowledge (from a conversation, Slack message, or meeting) and append it to one or more permanent table spec files (`specs/<table-id>/spec.md`). Runs outside the SDD implementation workflow — no active change required.

## Usage

```
/modscape:spec:note [table-id]
```

`[table-id]` is optional. After the command, paste or type the knowledge to record.

Examples:
```
/modscape:spec:note fct_orders
> Q1 2023 の updated_at は信頼不可。ETL バグにより NULL が混入している

/modscape:spec:note
> fct_orders の grain は1注文につき1行。
> dim_customers は SCD Type2 で grain は有効期間ごとの行。
```

## Instructions

### Step 1: Collect input

After the command is invoked, prompt the user to paste or type the knowledge they want to record:

> What would you like to note? (Paste text from a conversation, Slack, or meeting notes)

Wait for the user's free-text input before proceeding.

### Step 2: Determine target table(s)

**If `[table-id]` was provided:**
- Use that table ID directly.
- Skip to Step 3.

**If no `[table-id]` was provided:**
- Analyze the free-text input and identify all table IDs mentioned.
- Match against known tables by looking for snake_case identifiers that resemble table names (e.g., `fct_orders`, `dim_customers`).
- If one or more table IDs are confidently identified, proceed with those.
- If no table ID can be identified, stop and display:

  ```
  対象テーブルを特定できませんでした。
  `/modscape:spec:note <table-id>` でテーブルIDを指定して再実行してください。
  ```

  Then exit without writing any file.

### Step 3: Verify spec files exist

For each identified table ID, check whether `specs/<table-id>/spec.md` exists.

- If a spec file **does not exist**, stop and display:

  ```
  ⚠ specs/<table-id>/spec.md が見つかりません。
  先に /modscape:spec:generate を実行してspecを作成してください。
  ```

  Then exit without writing any file.

### Step 4: Determine target section for each update

For each piece of information extracted from the input, map it to the most appropriate section using the following rules:

| 入力の性質 | 書き込み先セクション |
|---|---|
| ビジネスルール・計算ロジック・定義・grain | `## Business Rules` |
| 既知の問題・データ品質の注意点・バグ・信頼性 | `## Known Issues / Caveats` |
| 背景・経緯・意図・由来 | `## Business Context` |
| オーナー・SLA・更新頻度 | `## Overview` |
| 上記に分類できないメモ | `## Known Issues / Caveats` |

When input covers multiple tables, split the content and assign each piece to the appropriate table and section independently.

### Step 5: Show confirmation preview

Before writing anything, display a preview of all planned updates:

```
以下の更新を行います:

📄 specs/fct_orders/spec.md
  セクション: Known Issues / Caveats
  追記内容: "Q1 2023 の updated_at は信頼不可。ETL バグにより NULL が混入している"

📄 specs/dim_customers/spec.md
  セクション: Business Rules
  追記内容: "SCD Type2。grain は顧客の有効期間ごとの1行"

続けますか？ [Y/n]
```

Wait for the user's response:
- If the user confirms (Y or Enter): proceed to Step 6.
- If the user declines (n): display `更新をキャンセルしました。` and exit without writing.

### Step 6: Write updates

For each planned update:

1. Read the target `specs/<table-id>/spec.md`.
2. Locate the target section (e.g., `## Business Rules`).
   - If the section **exists**: append a new bullet point at the end of that section.
   - If the section **does not exist**: append the section header followed by the new bullet at the end of the file.
3. Format the appended line as:
   ```
   - <content> <!-- noted <YYYY-MM-DD> -->
   ```
   Fill `<YYYY-MM-DD>` with today's date.
4. Write the updated file.

### Step 7: Display completion summary

After all updates are written:

```
✅ spec:note 完了

更新したファイル:
- specs/fct_orders/spec.md（Known Issues / Caveats に追記）
- specs/dim_customers/spec.md（Business Rules に追記）
```

## COMMAND: /modscape:spec:note

Usage: `/modscape:spec:note [table-id]`

Appends free-form knowledge to `specs/<table-id>/spec.md`. If no table ID is given, infers the target table(s) from the input text. Always shows a confirmation preview before writing.
