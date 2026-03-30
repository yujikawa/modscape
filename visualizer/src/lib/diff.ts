export type DiffLine =
  | { type: 'added'; content: string }
  | { type: 'removed'; content: string }
  | { type: 'unchanged'; content: string }

/**
 * Compute a line-level unified diff between two strings using LCS (Myers diff).
 */
export function computeDiff(baseline: string, current: string): DiffLine[] {
  const a = baseline === '' ? [] : baseline.split('\n')
  const b = current === '' ? [] : current.split('\n')

  // Remove trailing empty line from split if original didn't end with newline
  // (yaml.dump always adds a trailing newline, so both will have it)

  const lcs = computeLCS(a, b)
  const result: DiffLine[] = []

  let ai = 0
  let bi = 0
  let li = 0

  while (ai < a.length || bi < b.length) {
    if (li < lcs.length && ai < a.length && bi < b.length && a[ai] === lcs[li] && b[bi] === lcs[li]) {
      result.push({ type: 'unchanged', content: a[ai] })
      ai++; bi++; li++
    } else if (bi < b.length && (li >= lcs.length || b[bi] !== lcs[li])) {
      result.push({ type: 'added', content: b[bi] })
      bi++
    } else {
      result.push({ type: 'removed', content: a[ai] })
      ai++
    }
  }

  return result
}

/**
 * Compute the Longest Common Subsequence of two string arrays.
 * Uses space-optimized DP: O(m*n) time, O(min(m,n)) space.
 */
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length
  const n = b.length

  if (m === 0 || n === 0) return []

  // Use shorter array as columns to minimize memory
  const [rows, cols, rowArr, colArr] =
    m <= n ? [m, n, a, b] : [n, m, b, a]

  // dp[j] = LCS length for rowArr[0..i] and colArr[0..j]
  let prev = new Array(cols + 1).fill(0)
  let curr = new Array(cols + 1).fill(0)

  // Track choices for backtracking
  const choices: number[][] = []

  for (let i = 0; i < rows; i++) {
    const row: number[] = []
    for (let j = 0; j < cols; j++) {
      if (rowArr[i] === colArr[j]) {
        curr[j + 1] = prev[j] + 1
        row.push(1) // match
      } else if (prev[j + 1] >= curr[j]) {
        curr[j + 1] = prev[j + 1]
        row.push(2) // up
      } else {
        curr[j + 1] = curr[j]
        row.push(3) // left
      }
    }
    choices.push(row)
    ;[prev, curr] = [curr, prev]
    curr.fill(0)
  }

  // Backtrack to recover LCS
  const lcs: string[] = []
  let i = rows - 1
  let j = cols - 1
  while (i >= 0 && j >= 0) {
    const c = choices[i][j]
    if (c === 1) {
      lcs.push(rowArr[i])
      i--; j--
    } else if (c === 2) {
      i--
    } else {
      j--
    }
  }
  lcs.reverse()

  // If we swapped rows/cols, the LCS values are correct (content is the same)
  return lcs
}
