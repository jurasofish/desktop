import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Branch } from '../../models/branch'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IHardResetToBranchDialogProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly currentBranch: Branch
  readonly targetBranch: Branch
  readonly onDismissed: () => void
}

interface IHardResetToBranchDialogState {
  readonly isLoading: boolean
}

export class HardResetToBranchDialog extends React.Component<
  IHardResetToBranchDialogProps,
  IHardResetToBranchDialogState
> {
  public constructor(props: IHardResetToBranchDialogProps) {
    super(props)
    this.state = { isLoading: false }
  }

  public render() {
    return (
      <Dialog
        id="hard-reset-to-branch"
        type="warning"
        title="Hard Reset Current Branch?"
        loading={this.state.isLoading}
        disabled={this.state.isLoading}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        role="alertdialog"
        ariaDescribedBy="hard-reset-to-branch-warning"
      >
        <DialogContent>
          <div id="hard-reset-to-branch-warning">
            <p>
              This will hard reset <Ref>{this.props.currentBranch.name}</Ref> to{' '}
              <Ref>{this.props.targetBranch.name}</Ref>.
            </p>
            <p>
              Commits on <Ref>{this.props.currentBranch.name}</Ref> that are not
              reachable from <Ref>{this.props.targetBranch.name}</Ref> may be
              lost.
            </p>
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="Hard Reset" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = async () => {
    const { dispatcher, repository, targetBranch, onDismissed } = this.props
    this.setState({ isLoading: true })

    try {
      await dispatcher.hardResetCurrentBranchToBranch(repository, targetBranch)
    } finally {
      this.setState({ isLoading: false })
    }

    onDismissed()
  }
}
