import { describe, it } from 'node:test'
import assert from 'node:assert'

import { Repository } from '../../src/models/repository'
import { generateRepositoryListContextMenu } from '../../src/ui/repositories-list/repository-list-item-context-menu'

const baseConfig = {
  shellLabel: undefined,
  externalEditorLabel: undefined,
  askForConfirmationOnRemoveRepository: true,
  pinnedRepositories: [],
  onViewOnGitHub: () => {},
  onOpenInShell: () => {},
  onShowRepository: () => {},
  onOpenInExternalEditor: () => {},
  onRemoveRepository: () => {},
  onChangeRepositoryAlias: () => {},
  onRemoveRepositoryAlias: () => {},
  onPinRepository: () => {},
  onUnpinRepository: () => {},
  onMovePinnedRepositoryUp: () => {},
  onMovePinnedRepositoryDown: () => {},
}

describe('repository list item context menu', () => {
  it('does not show pin actions for missing repositories', () => {
    const repository = new Repository('missing-repo', 1, null, true)

    const items = generateRepositoryListContextMenu({
      ...baseConfig,
      repository,
    })

    assert.equal(
      items.some(item => item.label === 'Pin Repository'),
      false
    )
  })
})
