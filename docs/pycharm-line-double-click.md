# PyCharm line-number double-click

## Feature (user view)

GitHub Desktop already opens a file in PyCharm when the user double-clicks
its row in the History or Changes file list. That open lands on a line
chosen from the diff viewport.

This feature is a more precise way to do the same jump. When the user is
looking at a diff and wants to open a specific line in PyCharm, they can
double-click that line's line number in the gutter. PyCharm opens the file
at exactly that line.

### Where it works

- The History tab, in the diff for a selected commit's file.
- The Changes tab, in the diff for a working-tree file.

### Which line numbers respond

A line number responds to double-click when it has a meaningful position
in the current file on disk:

- Added rows (the `+` lines): the new-file line number is shown and is
  clickable.
- Modified rows in side-by-side view, after side: the green line number
  on the right is clickable.
- Context lines (the unchanged lines shown for context): the new-file
  line number is clickable. In side-by-side view that is the line number
  on the right; in unified view both old and new line numbers point at
  the same line in the new file, so either is fine.

### Which line numbers do nothing on double-click

- Deleted rows (the `-` lines), in any view. These lines do not exist in
  the current file on disk.
- The before-side line number of a Modified row in side-by-side view.
  That is the old version of the line; the new version sits on the right.
- Hunk header rows (the `@@ ...` separator). No file line to jump to.

### Interaction with line selection in the Changes tab

In the Changes tab the line-number gutter doubles as the selection
toggle. Clicking a selectable line number flips whether that line will be
included in the next commit. A double-click therefore briefly flips the
selection on, then off again, before PyCharm opens. The end state of the
selection matches what it was before the double-click. The user accepts
the brief flicker.

In the History tab the diff is read-only, so this concern does not apply.

### Editor scope

This only changes behaviour for PyCharm on macOS, in line with the rest
of the PyCharm integration described in `pycharm-integration.md`. Other
editors do not accept a line argument from this codebase and are not
affected.

### Out of scope

- Submodule, image, and binary diffs have no line numbers, so they do
  not participate.
- Hunk headers, blank gutter cells, and any other non-line target do
  nothing.
- Right-click context menus on line numbers are unchanged.
- The pull-request files-changed view is unchanged.

## Tentative implementation plan

Plans tend to drift once implementation starts. This section is the
starting point, not a contract.

### Background reading already in the repo

- `docs/pycharm-integration.md`: how PyCharm on macOS is launched.
  `getPyCharmFileArgs` builds the `<repo> --line N <relativePath>` form.
- `docs/pycharm-viewport-line.md`: the existing viewport-aware
  double-click on the file row. The chain
  `App -> Dispatcher -> AppStore -> launchExternalEditor` already
  carries an optional `line?: number` argument; the new feature reuses
  that chain.

### Shape of the change

A push-based callback from the diff gutter up to the consumer that owns
the file path and the editor dispatch:

1. The line-number `div` rendered by `SideBySideDiffRow.renderLineNumbers`
   gets an `onDoubleClick` listener. The handler decides, based on the
   row type and which column the target sits in, whether to fire. Fires
   for `Added`, `Modified` after-side, and `Context`. Does nothing for
   `Deleted`, `Modified` before-side, and `Hunk`. Passes the new-file
   line number out via a new optional prop, something like
   `onLineNumberDoubleClick(newLineNumber)`.
2. `SideBySideDiff` forwards the same callback to every row.
3. `Diff` forwards it to its inner `SideBySideDiff`.
4. `SeamlessDiffSwitcher` forwards it to its inner `Diff`.
5. The consumers receive the callback and know which file the diff is
   showing, so they can pair the line number with the current file path
   and call `dispatcher.openInExternalEditor(fullPath, repoPath, line)`.

### Consumers

- History tab: `app/src/ui/history/selected-commits.tsx`. Already holds
  `props.selectedFile` and `props.onOpenInExternalEditor(path, line?)`.
  Adds a `onSelectedFileLineDoubleClick(line)` arrow that calls
  `onOpenInExternalEditor(selectedFile.path, line)` when the file is
  text.
- Changes tab: `app/src/ui/changes/changes.tsx`. Has `props.file`. A new
  prop `onLineDoubleClickInExternalEditor(path, line)` arrives from
  `RepositoryView`, and `Changes` calls it with `props.file.path` and
  the supplied line.
- `RepositoryView` (`app/src/ui/repository.tsx`) wires the Changes-side
  callback through `this.props.onOpenInExternalEditor(path, line)`.

### Files likely to be touched

- `app/src/ui/diff/side-by-side-diff-row.tsx`
- `app/src/ui/diff/side-by-side-diff.tsx`
- `app/src/ui/diff/index.tsx`
- `app/src/ui/diff/seamless-diff-switcher.tsx`
- `app/src/ui/history/selected-commits.tsx`
- `app/src/ui/changes/changes.tsx`
- `app/src/ui/repository.tsx`

If the gutter handler needs to distinguish which span was clicked in a
unified-mode context row (each context row renders both old and new
line numbers inside a single label), `renderLineNumbers` may need to
wrap each line-number span with a column-tagged class so the
double-click handler can pick the right side. In side-by-side view this
is not an issue because each call to `renderLineNumbers` covers one
column.

### Context-line edge cases

- Unified context row: shows both `[oldLineNumber, newLineNumber]` in a
  single gutter cell. Either span maps to the same line in the current
  file on disk, so picking the new-side line number is unambiguous. If
  detecting the click target is fiddly, defaulting to the new-side line
  number for the whole gutter cell is fine.
- Side-by-side context row: each side renders its own `renderLineNumber`
  call. The after-side line number is what we want; the before-side is
  the old-file line and should be a no-op on double-click (consistent
  with Modified before-side behaviour).

### Selection-toggle round trip

The existing `onMouseDown` on the line-number `div` starts a temporary
selection. A double-click triggers two `mousedown`/`mouseup` pairs,
which run the existing selection commit twice, returning the line to
its original selection state. The `dblclick` event then fires and runs
the new open-in-editor path. No `preventDefault` or `stopPropagation`
needed.

### Testing

Mostly manual. The pure decision rule (row type + column ->
line number to emit) is small enough that it can live in
`diff-helpers.tsx` next to `findTopVisibleNewLineNumber` if it makes the
row handler smaller, but is not worth its own complex unit test rig.

### Out-of-scope reminders

- No changes to the editor dispatch chain itself; the optional `line`
  argument is already supported.
- No changes to non-PyCharm launch paths.
- No changes to the file-row double-click behaviour from
  `docs/pycharm-viewport-line.md`. The two features coexist:
  double-clicking the file row uses the viewport heuristic;
  double-clicking a line number uses that exact line.
