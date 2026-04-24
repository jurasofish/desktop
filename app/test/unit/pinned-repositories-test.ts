import { describe, it } from 'node:test'
import assert from 'node:assert'
import { getPinnedRepositoryAtIndex } from '../../src/lib/pinned-repositories'
import { Repository } from '../../src/models/repository'
import { CloningRepository } from '../../src/models/cloning-repository'

describe('pinned repositories', () => {
  it('resolves repositories by stored pinned order', () => {
    const repoA = new Repository('a', 1, null, false)
    const repoB = new Repository('b', 2, null, false)
    const repoC = new Repository('c', 3, null, false)

    const repository = getPinnedRepositoryAtIndex(
      [repoA, repoB, repoC],
      [3, 1],
      0
    )

    assert.equal(repository?.id, 3)
  })

  it('returns null when the slot is out of range', () => {
    const repo = new Repository('a', 1, null, false)

    const repository = getPinnedRepositoryAtIndex([repo], [1], 1)

    assert.equal(repository, null)
  })

  it('returns null for missing repositories', () => {
    const missingRepository = new Repository('missing', 1, null, true)

    const repository = getPinnedRepositoryAtIndex([missingRepository], [1], 0)

    assert.equal(repository, null)
  })

  it('returns null for stale pinned ids', () => {
    const repo = new Repository('a', 1, null, false)

    const repository = getPinnedRepositoryAtIndex([repo], [2], 0)

    assert.equal(repository, null)
  })

  it('ignores cloning repositories', () => {
    const cloningRepository = new CloningRepository(
      '/tmp/repo',
      'https://example.com/repo'
    )

    const repository = getPinnedRepositoryAtIndex([cloningRepository], [1], 0)

    assert.equal(repository, null)
  })
})
