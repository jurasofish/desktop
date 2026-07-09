# PyCharm integration

GitHub Desktop already opens files and repositories in the configured external
editor, but the current macOS PyCharm path is too generic. It launches PyCharm
through `open -a`, which hands a file to whichever PyCharm window is currently
frontmost instead of the project that owns that file. That is fine for simple
app launching and bad for multi-project PyCharm use.

Manual testing on macOS showed that the direct PyCharm launcher behaves much
better than `open -a`.

- `open -a "PyCharm.app" <file>` opens the file in the frontmost PyCharm
  window, even when that window belongs to the wrong repository.
- `pycharm <file>` opens the file in the correct already-open PyCharm project
  window.
- `pycharm <repo>` opens or focuses the correct PyCharm project window for that
  repository.
- `pycharm <repo> <nested-file>` opens or focuses the correct PyCharm project
  window and opens the file there.
- Root-level files on macOS need a slightly different form:
  `pycharm <repo> --line 1 ./<file>`. That also works when the repository is
  not already open in PyCharm: it opens the project and the file in one step.

The feature is therefore to treat PyCharm on macOS as a special editor
integration instead of sending it through the generic app launcher.

When the selected external editor is PyCharm, opening a repository from Desktop
should invoke the direct PyCharm launcher with the repository path. This should
bring the existing PyCharm window for that repository to the front when one is
already open, and otherwise open the repository in PyCharm.

When the selected external editor is PyCharm, opening a file from Desktop should
invoke the direct PyCharm launcher with the repository path and a repo-relative
file path, plus `--line 1`. Manual testing showed that this avoids a PyCharm
macOS edge case where root-level files such as `README.md` fail when passed as a
plain file argument alongside the project path. This should apply anywhere
Desktop opens a repository file in the external editor, including double-
clicking changed files and other file-level editor actions.

Desktop should also add a `Ctrl+E` shortcut for opening the current repository
in PyCharm. If the current repository is already open in PyCharm, this should
bring that window to the front. If it is not open yet, this should open the
repository in PyCharm. In normal use there is already a current repository, but
this remains repository-scoped so the command stays disabled anywhere Desktop is
showing the welcome flow or otherwise has no active repository.

This does not need AppleScript, Accessibility automation, or editor window
tracking inside Desktop. The tested direct PyCharm launcher behaviour is enough
for this cut.
