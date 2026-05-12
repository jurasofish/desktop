# PyCharm viewport-aware line jumps

When viewing a commit in the History tab, or viewing uncommitted changes in
the Changes tab, double-clicking a changed file in the file list opens that
file in the configured external editor. With PyCharm on macOS this currently
goes through the special launcher described in `pycharm-integration.md`,
which always passes `--line 1`. PyCharm therefore opens the file at the top,
even when the user was looking at a change well inside the file.

The feature is to make that double-click open PyCharm at roughly the spot the
user is already looking at in the diff, instead of at line 1.

## Behaviour

When the user double-clicks a file row in either the History view's
changed-files list or the Changes view's changed-files list, Desktop should
look at what is currently visible in the diff pane and pick a line number for
PyCharm to jump to.

- The chosen line is the new-file line number of the topmost row in the diff
  viewport that is itself an addition or modification. Context rows
  (unchanged lines shown for context) and deletion-only rows are skipped.
- If no addition or modification row is visible in the current viewport, the
  launch falls back to `--line 1`, matching today's behaviour.
- This only changes behaviour for PyCharm on macOS, because that is the only
  editor integration with line-jump support in this codebase. Other editors
  remain untouched.
- This only changes behaviour for the changed-files double click in the
  History view and the Changes view. `Ctrl+E`, right-click "Open in external
  editor" entries, the pull-request files-changed view, and any other entry
  point keep their current behaviour.
- Right-click "Open in external editor" stays line-agnostic on both tabs, so
  the context-menu entry is wired to a separate handler from double-click.
- Both side-by-side and unified diff modes are supported. They share the same
  underlying component, so the same mechanism covers both.
- Image diffs, binary diffs, submodule diffs, and any other non-text diff
  cannot contribute a line number. In those cases the launch falls back to
  `--line 1`.

## Implementation outline

1. `SideBySideDiff` (in `app/src/ui/diff/side-by-side-diff.tsx`) already
   renders rows through a `react-virtualized` `List`. Track the index of the
   first visible row from `onRowsRendered`'s `startIndex`. Expose an
   imperative method on the component, e.g.
   `getTopVisibleNewLineNumber(): number | null`, that walks forward from the
   current first visible row and returns the new-file line number of the
   first addition or modification row it finds, or `null` if there is none.

2. `SeamlessDiffSwitcher` already forwards a ref to the inner diff
   component for the existing search integration. Extend that so callers can
   reach `getTopVisibleNewLineNumber` from the outside.

3. In `app/src/ui/history/selected-commits.tsx`, hold the latest handle for
   the history diff. In `onRowDoubleClick`, query the topmost visible new
   line number and pass it through `onOpenInExternalEditor`.

   For the Changes tab, the diff lives in `Changes` and the file list lives
   in `ChangesSidebar`. `RepositoryView` holds both as siblings, so it owns
   the handle for the working-tree diff and exposes a
   `onChangedFileDoubleClickInExternalEditor` callback that the sidebar wires
   to its double-click handler. The sidebar's existing
   `onOpenItemInExternalEditor` (used by the right-click menu entry) stays
   line-agnostic.

4. Thread an optional `line?: number` through the chain:
   - `App.openInExternalEditor` in `app/src/ui/app.tsx`
   - `Dispatcher.openInExternalEditor` in `app/src/ui/dispatcher/dispatcher.ts`
   - `AppStore._openInExternalEditor` in `app/src/lib/stores/app-store.ts`
   - `launchExternalEditor` in `app/src/lib/editors/launch.ts`

   Every existing caller stays unchanged because `line` is optional.

5. `getPyCharmFileArgs` in `app/src/lib/editors/launch.ts` accepts the line
   number and uses it in the `--line` argument instead of the hard-coded
   `'1'`. When the caller does not supply a line, it keeps the current
   `'1'` to preserve the root-file workaround.

6. Tests in `app/test/unit/pycharm-test.ts` get extended to cover the new
   `--line` argument behaviour with and without a supplied line number.
