import { Repository } from '../models/repository'
import { CloningRepository } from '../models/cloning-repository'

export function getPinnedRepositoryAtIndex(
  repositories: ReadonlyArray<Repository | CloningRepository>,
  pinnedRepositories: ReadonlyArray<number>,
  index: number
): Repository | null {
  const repositoryId = pinnedRepositories[index]
  if (repositoryId === undefined) {
    return null
  }

  const repository = repositories.find(
    r => r instanceof Repository && !r.missing && r.id === repositoryId
  )

  return repository instanceof Repository ? repository : null
}
