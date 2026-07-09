export function isPyCharmEditor(editorName: string | null): boolean {
  return editorName === 'PyCharm' || editorName === 'PyCharm Community Edition'
}

export function getOpenInExternalEditorAccelerator(
  selectedExternalEditor: string | null
): string {
  return __DARWIN__ && isPyCharmEditor(selectedExternalEditor)
    ? 'Ctrl+E'
    : 'CmdOrCtrl+Shift+A'
}
