import { IMenuItem } from '../../lib/menu-item'
import { clipboard } from 'electron'

interface IBranchContextMenuConfig {
  name: string
  isLocal: boolean
  onRenameBranch?: (branchName: string) => void
  onViewBranchOnGitHub?: () => void
  onViewPullRequestOnGitHub?: () => void
  onCreateBranchFromBranch?: (branchName: string) => void
  onSquashMergeIntoCurrentBranch?: (branchName: string) => void
  canSquashMergeIntoCurrentBranch?: (branchName: string) => boolean
  onHardResetToBranch?: (branchName: string) => void
  canHardResetToBranch?: (branchName: string) => boolean
  onDeleteBranch?: (branchName: string) => void
}

export function generateBranchContextMenuItems(
  config: IBranchContextMenuConfig
): IMenuItem[] {
  const {
    name,
    isLocal,
    onRenameBranch,
    onViewBranchOnGitHub,
    onViewPullRequestOnGitHub,
    onCreateBranchFromBranch,
    onSquashMergeIntoCurrentBranch,
    canSquashMergeIntoCurrentBranch,
    onHardResetToBranch,
    canHardResetToBranch,
    onDeleteBranch,
  } = config
  const items = new Array<IMenuItem>()

  if (onRenameBranch !== undefined) {
    items.push({
      label: 'Rename…',
      action: () => onRenameBranch(name),
      enabled: isLocal,
    })
  }

  items.push({
    label: __DARWIN__ ? 'Copy Branch Name' : 'Copy branch name',
    action: () => clipboard.writeText(name),
  })

  if (onViewBranchOnGitHub !== undefined) {
    items.push({
      label: 'View Branch on GitHub',
      action: () => onViewBranchOnGitHub(),
    })
  }

  if (onViewPullRequestOnGitHub !== undefined) {
    items.push({
      label: 'View Pull Request on GitHub',
      action: () => onViewPullRequestOnGitHub(),
    })
  }

  items.push({ type: 'separator' })

  if (onCreateBranchFromBranch !== undefined) {
    items.push({
      label: __DARWIN__
        ? 'New Branch from This Branch…'
        : 'New branch from this branch…',
      action: () => onCreateBranchFromBranch(name),
    })
  }

  if (onSquashMergeIntoCurrentBranch !== undefined) {
    items.push({
      label: __DARWIN__
        ? 'Squash and Merge into Current Branch…'
        : 'Squash and merge into current branch…',
      action: () => onSquashMergeIntoCurrentBranch(name),
      enabled: canSquashMergeIntoCurrentBranch?.(name) ?? true,
    })
  }

  if (onHardResetToBranch !== undefined) {
    items.push({
      label: __DARWIN__
        ? 'Hard Reset Current Branch to This Branch…'
        : 'Hard reset current branch to this branch…',
      action: () => onHardResetToBranch(name),
      enabled: canHardResetToBranch?.(name) ?? true,
    })
  }

  if (onDeleteBranch !== undefined) {
    items.push({
      label: 'Delete…',
      action: () => onDeleteBranch(name),
    })
  }

  return items
}
