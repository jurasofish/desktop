import assert from 'node:assert'
import { describe, it } from 'node:test'

import { DiffHunkExpansionType } from '../../../src/models/diff'
import {
  DiffRowType,
  SimplifiedDiffRow,
  SimplifiedDiffRowData,
  findTopVisibleNewLineNumber,
} from '../../../src/ui/diff/diff-helpers'

function rowData(lineNumber: number): SimplifiedDiffRowData {
  return {
    content: '',
    lineNumber,
    diffLineNumber: lineNumber,
    noNewLineIndicator: false,
    tokens: [],
  }
}

function added(lineNumber: number): SimplifiedDiffRow {
  return {
    type: DiffRowType.Added,
    data: rowData(lineNumber),
    hunkStartLine: 1,
  }
}

function deleted(lineNumber: number): SimplifiedDiffRow {
  return {
    type: DiffRowType.Deleted,
    data: rowData(lineNumber),
    hunkStartLine: 1,
  }
}

function modified(beforeLine: number, afterLine: number): SimplifiedDiffRow {
  return {
    type: DiffRowType.Modified,
    beforeData: rowData(beforeLine),
    afterData: rowData(afterLine),
    hunkStartLine: 1,
  }
}

function context(beforeLine: number, afterLine: number): SimplifiedDiffRow {
  return {
    type: DiffRowType.Context,
    content: '',
    beforeLineNumber: beforeLine,
    afterLineNumber: afterLine,
    beforeTokens: [],
    afterTokens: [],
  }
}

function hunk(): SimplifiedDiffRow {
  return {
    type: DiffRowType.Hunk,
    content: '@@',
    expansionType: DiffHunkExpansionType.None,
    hunkIndex: 0,
  }
}

describe('findTopVisibleNewLineNumber', () => {
  it('returns null for an empty array', () => {
    assert.strictEqual(findTopVisibleNewLineNumber([], 0, 0), null)
  })

  it('skips hunk, context, and deletion-only rows', () => {
    const rows = [hunk(), context(10, 16), deleted(11), added(17), added(18)]
    assert.strictEqual(
      findTopVisibleNewLineNumber(rows, 0, rows.length - 1),
      17
    )
  })

  it('returns the after-line of a modified row when it is topmost', () => {
    const rows = [context(10, 16), modified(11, 17), added(18)]
    assert.strictEqual(
      findTopVisibleNewLineNumber(rows, 0, rows.length - 1),
      17
    )
  })

  it('honours the start index and ignores rows above it', () => {
    const rows = [added(5), context(6, 6), added(7), added(8)]
    assert.strictEqual(findTopVisibleNewLineNumber(rows, 1, rows.length - 1), 7)
  })

  it('honours the stop index and ignores rows below it', () => {
    const rows = [context(1, 1), deleted(2), context(2, 2), added(99)]
    assert.strictEqual(findTopVisibleNewLineNumber(rows, 0, 2), null)
  })

  it('clamps a stop index beyond the array length', () => {
    const rows = [context(1, 1), added(42)]
    assert.strictEqual(findTopVisibleNewLineNumber(rows, 0, 999), 42)
  })

  it('returns null when the visible range has no addition or modification', () => {
    const rows = [hunk(), context(1, 1), deleted(2), context(2, 2)]
    assert.strictEqual(
      findTopVisibleNewLineNumber(rows, 0, rows.length - 1),
      null
    )
  })
})
