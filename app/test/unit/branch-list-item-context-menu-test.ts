import { describe, it } from 'node:test'
import assert from 'node:assert'

import { Branch, BranchType } from '../../src/models/branch'
import { generateBranchContextMenuItems } from '../../src/ui/branches/branch-list-item-context-menu'

const branch = new Branch(
  'feature-branch',
  null,
  { sha: '1234567890' },
  BranchType.Local,
  'refs/heads/feature-branch'
)

describe('branch list item context menu', () => {
  it('passes the selected branch name to custom branch actions', () => {
    const calls = new Array<string>()

    const items = generateBranchContextMenuItems({
      branch,
      onCreateBranchFromBranch: name => calls.push(`create:${name}`),
      onSquashMergeIntoCurrentBranch: name => calls.push(`squash:${name}`),
      canSquashMergeIntoCurrentBranch: name => name === branch.name,
      onHardResetToBranch: name => calls.push(`reset:${name}`),
      canHardResetToBranch: name => name === branch.name,
    })

    const createItem = items.find(item =>
      item.label?.includes('Branch from This Branch')
    )
    const squashItem = items.find(item =>
      item.label?.includes('Merge into Current Branch')
    )
    const hardResetItem = items.find(item =>
      item.label?.includes('Reset Current Branch')
    )

    assert.equal(squashItem?.enabled, true)
    assert.equal(hardResetItem?.enabled, true)

    createItem?.action?.()
    squashItem?.action?.()
    hardResetItem?.action?.()

    assert.deepEqual(calls, [
      'create:feature-branch',
      'squash:feature-branch',
      'reset:feature-branch',
    ])
  })
})
