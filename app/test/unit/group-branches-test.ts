import { describe, it } from 'node:test'
import assert from 'node:assert'
import { groupBranches } from '../../src/ui/branches'
import { Branch, BranchType } from '../../src/models/branch'
import { CommitIdentity } from '../../src/models/commit-identity'

describe('Branches grouping', () => {
  const author = new CommitIdentity('Hubot', 'hubot@github.com', new Date())

  const branchTip = {
    sha: '300acef',
    author,
  }

  const currentBranch = new Branch(
    'master',
    null,
    branchTip,
    BranchType.Local,
    ''
  )
  const defaultBranch = new Branch(
    'master',
    null,
    branchTip,
    BranchType.Local,
    ''
  )
  const recentBranches = [
    new Branch('some-recent-branch', null, branchTip, BranchType.Local, ''),
  ]
  const otherBranch = new Branch(
    'other-branch',
    null,
    branchTip,
    BranchType.Local,
    ''
  )
  const backupBranch = new Branch(
    'backup/branch',
    null,
    branchTip,
    BranchType.Local,
    ''
  )
  const secondOtherBranch = new Branch(
    'second-other-branch',
    null,
    branchTip,
    BranchType.Local,
    ''
  )
  const secondBackupBranch = new Branch(
    'backup/second-branch',
    null,
    branchTip,
    BranchType.Local,
    ''
  )

  const allBranches = [currentBranch, ...recentBranches, otherBranch]

  it('should group branches', () => {
    const groups = groupBranches(
      defaultBranch,
      currentBranch,
      allBranches,
      recentBranches
    )
    assert.equal(groups.length, 3)

    assert.equal(groups[0].identifier, 'default')
    let items = groups[0].items
    assert.equal(items[0].branch, defaultBranch)

    assert.equal(groups[1].identifier, 'recent')
    items = groups[1].items
    assert.equal(items[0].branch, recentBranches[0])

    assert.equal(groups[2].identifier, 'other')
    items = groups[2].items
    assert.equal(items[0].branch, otherBranch)
  })

  it('should place backup branches after other branches', () => {
    const groups = groupBranches(
      null,
      null,
      [backupBranch, otherBranch, secondBackupBranch, secondOtherBranch],
      []
    )

    assert.deepEqual(
      groups[0].items.map(item => item.branch),
      [otherBranch, secondOtherBranch, backupBranch, secondBackupBranch]
    )
  })

  it('should keep backup branches in Recent', () => {
    const groups = groupBranches(
      defaultBranch,
      currentBranch,
      [currentBranch, backupBranch],
      [backupBranch]
    )

    assert.equal(groups[0].identifier, 'default')
    assert.equal(groups[1].identifier, 'recent')
    assert.equal(groups[1].items[0].branch, backupBranch)
  })
})
