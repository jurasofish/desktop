# Repository pinning

Repository pinning adds a pinned section to the repository switcher so a small
set of repositories can stay at the top in a user-defined order. The goal is
simple: the user can keep a handful of repos visible and stable instead of
relying on whatever happens to be recent.

Pinned repositories appear in a `Pinned` group above `Recent`. They also remain
in their normal owner, enterprise, or other group. `Recent` keeps its current
behaviour. If a pinned repository also appears there, that is acceptable for
this branch.

Pinning and unpinning happens from the repository row context menu only. The
same menu also provides `Move up in pinned list` and `Move down in pinned list`
when the repository is pinned. There is no drag and drop in this cut, and there
is no extra pin icon in the list. The section header is enough.

The pinned order is manual, persistent, and not alphabetical. A repository keeps
its place until the user explicitly moves it. There is no fixed limit on the
number of pinned repositories.

Pinned repository IDs are stored locally and restored on startup. The stored
order is the display order. If a repository is removed from Desktop, it must
also be removed from the pinned list. If a pinned repository is missing on disk,
it may be dropped from the pinned list as part of normal cleanup rather than
special-case UI handling.

Filtering does not need special treatment beyond keeping the implementation
simple and predictable. If pinned matches continue to appear under `Pinned`
while filtering, that is fine.

Pinned repositories can also be opened directly with `Ctrl+1` through
`Ctrl+0`, mapped to the first ten pinned repositories in stored order. `Ctrl+1`
selects the first pinned repository, `Ctrl+9` selects the ninth, and `Ctrl+0`
selects the tenth. If a shortcut refers to a position with no pinned
repository, it does nothing.

These shortcuts replace the previous `Show Changes`, `Show History`, and `Reset
Zoom` accelerators, and also take over the `Ctrl+8` and `Ctrl+9` combinations
that were previously used for zoom controls. The menu commands still exist, but
pinned repository selection now owns the number-row shortcuts.

This feature does not need a feature flag or extra settings surface.

See

- https://github.com/desktop/desktop/pull/20886
- https://github.com/ByteSizedMarius/gh-desktop-patches/blob/main/patches/pins.patch
