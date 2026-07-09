import * as React from 'react'
import { DiffHeader } from '../diff/diff-header'
import {
  DiffSelection,
  IDiff,
  ImageDiffType,
  ITextDiff,
} from '../../models/diff'
import { WorkingDirectoryFileChange } from '../../models/status'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { SeamlessDiffSwitcher } from '../diff/seamless-diff-switcher'
import { ISideBySideDiffHandle } from '../diff/side-by-side-diff'
import { isPyCharmEditor } from '../../lib/editors/pycharm'
import { PopupType } from '../../models/popup'

interface IChangesProps {
  readonly repository: Repository
  readonly file: WorkingDirectoryFileChange
  readonly diff: IDiff | null
  readonly dispatcher: Dispatcher
  readonly imageDiffType: ImageDiffType

  /** Whether a commit is in progress */
  readonly isCommitting: boolean
  readonly hideWhitespaceInDiff: boolean

  /**
   * Called when the user requests to open a binary file in an the
   * system-assigned application for said file type.
   */
  readonly onOpenBinaryFile: (fullPath: string) => void

  /** Called when the user requests to open a submodule. */
  readonly onOpenSubmodule: (fullPath: string) => void

  /**
   * Called when the user is viewing an image diff and requests
   * to change the diff presentation mode.
   */
  readonly onChangeImageDiffType: (type: ImageDiffType) => void

  /**
   * Whether we should show a confirmation dialog when the user
   * discards changes
   */
  readonly askForConfirmationOnDiscardChanges: boolean

  /**
   * Whether we should display side by side diffs.
   */
  readonly showSideBySideDiff: boolean

  /** Whether or not to show the diff check marks indicating inclusion in a commit */
  readonly showDiffCheckMarks: boolean

  /** Called when the user opens the diff options popover */
  readonly onDiffOptionsOpened: () => void

  /**
   * Called when the underlying text-diff component mounts and unmounts so
   * that parents can hold an imperative handle for querying viewport state.
   */
  readonly onDiffHandleChanged?: (
    filePath: string,
    handle: ISideBySideDiffHandle | null
  ) => void

  /**
   * Called when the user double-clicks a line-number gutter cell in the
   * working-tree diff and that cell resolves to a new-file line. The
   * consumer is responsible for opening the file in the external editor
   * at that line.
   */
  readonly onOpenLineInExternalEditor?: (path: string, line: number) => void

  /** The name of the currently selected external editor. */
  readonly externalEditorLabel?: string
}

export class Changes extends React.Component<IChangesProps, {}> {
  /**
   * Whether or not it's currently possible to change the line selection
   * of a diff. Changing selection is not possible while a commit is in
   * progress or if the user has opted to hide whitespace changes.
   */
  private get lineSelectionDisabled() {
    return this.props.isCommitting || this.props.hideWhitespaceInDiff
  }

  private onDiffLineIncludeChanged = (selection: DiffSelection) => {
    if (!this.lineSelectionDisabled) {
      const { repository, file } = this.props
      this.props.dispatcher.changeFileLineSelection(repository, file, selection)
    }
  }

  private onDiscardChanges = (
    diff: ITextDiff,
    diffSelection: DiffSelection
  ) => {
    if (this.lineSelectionDisabled) {
      return
    }

    if (this.props.askForConfirmationOnDiscardChanges) {
      this.props.dispatcher.showPopup({
        type: PopupType.ConfirmDiscardSelection,
        repository: this.props.repository,
        file: this.props.file,
        diff,
        selection: diffSelection,
      })
    } else {
      this.props.dispatcher.discardChangesFromSelection(
        this.props.repository,
        this.props.file.path,
        diff,
        diffSelection
      )
    }
  }

  public render() {
    return (
      <div className="diff-container">
        <DiffHeader
          path={this.props.file.path}
          status={this.props.file.status}
          diff={this.props.diff}
          showSideBySideDiff={this.props.showSideBySideDiff}
          onShowSideBySideDiffChanged={this.onShowSideBySideDiffChanged}
          hideWhitespaceInDiff={this.props.hideWhitespaceInDiff}
          onHideWhitespaceInDiffChanged={this.onHideWhitespaceInDiffChanged}
          onDiffOptionsOpened={this.props.onDiffOptionsOpened}
        />

        <SeamlessDiffSwitcher
          repository={this.props.repository}
          imageDiffType={this.props.imageDiffType}
          file={this.props.file}
          readOnly={false}
          onIncludeChanged={this.onDiffLineIncludeChanged}
          onDiscardChanges={this.onDiscardChanges}
          diff={this.props.diff}
          hideWhitespaceInDiff={this.props.hideWhitespaceInDiff}
          showSideBySideDiff={this.props.showSideBySideDiff}
          showDiffCheckMarks={this.props.showDiffCheckMarks}
          askForConfirmationOnDiscardChanges={
            this.props.askForConfirmationOnDiscardChanges
          }
          onOpenBinaryFile={this.props.onOpenBinaryFile}
          onOpenSubmodule={this.props.onOpenSubmodule}
          onChangeImageDiffType={this.props.onChangeImageDiffType}
          onHideWhitespaceInDiffChanged={this.onHideWhitespaceInDiffChanged}
          onDiffHandleChanged={this.onDiffHandleChanged}
          onLineNumberDoubleClick={
            this.canOpenLineInExternalEditor
              ? this.onDiffLineNumberDoubleClick
              : undefined
          }
        />
      </div>
    )
  }

  private get canOpenLineInExternalEditor() {
    return __DARWIN__ && isPyCharmEditor(this.props.externalEditorLabel ?? null)
  }

  private onDiffHandleChanged = (handle: ISideBySideDiffHandle | null) => {
    this.props.onDiffHandleChanged?.(this.props.file.path, handle)
  }

  private onDiffLineNumberDoubleClick = (newLineNumber: number) => {
    this.props.onOpenLineInExternalEditor?.(this.props.file.path, newLineNumber)
  }

  private onShowSideBySideDiffChanged = (showSideBySideDiff: boolean) => {
    this.props.dispatcher.onShowSideBySideDiffChanged(showSideBySideDiff)
  }

  private onHideWhitespaceInDiffChanged = (hideWhitespaceInDiff: boolean) => {
    return this.props.dispatcher.onHideWhitespaceInChangesDiffChanged(
      hideWhitespaceInDiff,
      this.props.repository
    )
  }
}
