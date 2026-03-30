export type DiffLine =
  | { type: 'added'; content: string }
  | { type: 'removed'; content: string }
  | { type: 'unchanged'; content: string }

/**
 * Compute a line-level unified diff between two strings.
 *
 * Uses contextualized LCS on the reversed sequences to prefer matching later occurrences
 * of duplicate lines while ensuring lines from different blocks are not mixed.
 */
export function computeDiff(baseline: string, current: string): DiffLine[] {
  const a = baseline === '' ? [] : baseline.split('\n')
  const b = current === '' ? [] : current.split('\n')

  // Contextualize lines to avoid matching identical lines across different blocks.
  const ctxA = contextualize(a)
  const ctxB = contextualize(b)

  // Compute LCS on reversed contextualized sequences.
  const revA = [...ctxA].reverse()
  const revB = [...ctxB].reverse()
  const revPairs = computeLCSPairs(revA, revB)

  // Convert reversed indices back to original indices and sort ascending by ai.
  const m = a.length
  const n = b.length
  const pairs = revPairs
    .map(({ ai, bi }) => ({ ai: m - 1 - ai, bi: n - 1 - bi }))
    .sort((x, y) => x.ai - y.ai)

  const result: DiffLine[] = []
  let ai = 0
  let bi = 0
  let pi = 0

  while (ai < a.length || bi < b.length) {
    if (pi < pairs.length && pairs[pi].ai === ai && pairs[pi].bi === bi) {
      result.push({ type: 'unchanged', content: a[ai] })
      ai++; bi++; pi++
    } else if (pi < pairs.length && ai < pairs[pi].ai) {
      result.push({ type: 'removed', content: a[ai] })
      ai++
    } else if (bi < b.length && (pi >= pairs.length || bi < pairs[pi].bi)) {
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
 * Add context to each line based on indentation to make identical lines unique
 * to their parent block. This is a heuristic for YAML/structured data.
 */
function contextualize(lines: string[]): string[] {
  const stack: { indent: number; content: string; signature: string }[] = []
  
  return lines.map((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) return line

    const indent = line.search(/\S/)

    // Pop from stack if current line is less indented than stack top
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    let signature = stack.length > 0 ? stack[stack.length - 1].signature : ''

    // If it's a list item, we try to extract a signature from its contents
    // to uniquely identify this block (e.g. by table name).
    if (trimmed.startsWith('-')) {
      const blockContent = []
      for (let i = index; i < Math.min(index + 5, lines.length); i++) {
        const l = lines[i].trim()
        if (i > index && l.startsWith('-')) break
        // Extract values from "key: value" or just "value"
        const value = l.includes(':') ? l.split(':').slice(1).join(':').trim() : l
        if (value && value !== '-' && !value.endsWith(':')) {
          blockContent.push(value)
        }
      }
      signature = blockContent.join('|')
    }

    // Add current context and signature to line
    const context = stack.map(s => s.content).join('|')
    let result = line
    if (context) result += ` ⦈ctx:${context}⦈`
    if (signature) result += ` ⦈sig:${signature}⦈`

    // Push "key-like" or "list-item" lines to stack for children
    if (trimmed.endsWith(':') || trimmed.startsWith('-')) {
      stack.push({ indent, content: trimmed, signature })
    }

    return result
  })
}

/**
 * Compute the LCS of two string arrays and return matched index pairs {ai, bi}.
 * Uses weighted LCS to prefer matching unique lines (anchors).
 * O(m*n) time, O(min(m,n)) space.
 */
function computeLCSPairs(a: string[], b: string[]): { ai: number; bi: number }[] {
  const m = a.length
  const n = b.length

  if (m === 0 || n === 0) return []

  // Pre-calculate uniqueness for weighting.
  // Lines that are unique in BOTH strings are strong anchors.
  const countsA = new Map<string, number>()
  for (const s of a) countsA.set(s, (countsA.get(s) || 0) + 1)
  const countsB = new Map<string, number>()
  for (const s of b) countsB.set(s, (countsB.get(s) || 0) + 1)
  const isUnique = (s: string) => countsA.get(s) === 1 && countsB.get(s) === 1

  const swapped = m > n
  const [rows, cols, rowArr, colArr] = swapped ? [n, m, b, a] : [m, n, a, b]

  let prev = new Array(cols + 1).fill(0)
  let curr = new Array(cols + 1).fill(0)
  const choices: number[][] = []

  for (let i = 0; i < rows; i++) {
    const row: number[] = []
    const weight = isUnique(rowArr[i]) ? 20 : 1
    
    for (let j = 0; j < cols; j++) {
      if (rowArr[i] === colArr[j] && prev[j] + weight > curr[j]) {
        curr[j + 1] = prev[j] + weight
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

  const pairs: { ri: number; ci: number }[] = []
  let i = rows - 1
  let j = cols - 1
  while (i >= 0 && j >= 0) {
    const c = choices[i][j]
    if (c === 1) {
      pairs.push({ ri: i, ci: j })
      i--; j--
    } else if (c === 2) {
      i--
    } else {
      j--
    }
  }
  pairs.reverse()

  return pairs.map(({ ri, ci }) =>
    swapped ? { ai: ci, bi: ri } : { ai: ri, bi: ci }
  )
}
