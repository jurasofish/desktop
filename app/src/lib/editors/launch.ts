import * as Path from 'path'
import { spawn, SpawnOptions } from 'child_process'
import { pathExists } from '../path-exists'
import { execFile } from '../exec-file'
import { ExternalEditorError, FoundEditor } from './shared'
import { isPyCharmEditor } from './pycharm'
import {
  expandTargetPathArgument,
  ICustomIntegration,
  parseCustomIntegrationArguments,
} from '../custom-integration'

async function launchEditor(
  editorPath: string,
  args: readonly string[],
  editorName: string,
  spawnAsDarwinApp: boolean,
  cwd?: string
) {
  const exists = await pathExists(editorPath)
  const label = __DARWIN__ ? 'Settings' : 'Options'
  if (!exists) {
    throw new ExternalEditorError(
      `Could not find executable for ${editorName} at path '${editorPath}'. Please open ${label} and select an available editor.`,
      { openPreferences: true }
    )
  }

  return new Promise<void>((resolve, reject) => {
    const opts: SpawnOptions = {
      // Make sure the editor processes are detached from the Desktop app.
      // Otherwise, some editors (like Notepad++) will be killed when the
      // Desktop app is closed.
      detached: true,
      stdio: 'ignore',
      cwd,
    }

    const command = spawnAsDarwinApp
      ? ['open', '-a', editorPath, ...args]
      : [editorPath, ...args]

    log.debug(
      `[external-editor] launching ${command.join(' ')}${
        cwd ? ` (cwd: ${cwd})` : ''
      }`
    )

    const child = spawnAsDarwinApp
      ? spawn('open', ['-a', editorPath, ...args], opts)
      : spawn(editorPath, args, opts)

    child.on('error', reject)
    child.on('spawn', resolve)
    child.unref() // Don't wait for editor to exit
  }).catch((e: unknown) => {
    log.error(
      `Error while launching ${editorName}`,
      e instanceof Error ? e : undefined
    )
    throw new ExternalEditorError(
      e && typeof e === 'object' && 'code' in e && e.code === 'EACCES'
        ? `GitHub Desktop doesn't have the proper permissions to start ${editorName}. Please open ${label} and try another editor.`
        : `Something went wrong while trying to start ${editorName}. Please open ${label} and try another editor.`,
      { openPreferences: true }
    )
  })
}

async function getMacOSAppExecutablePath(
  appPath: string,
  editorName: string
): Promise<string> {
  const infoPlistPath = Path.join(appPath, 'Contents', 'Info.plist')

  try {
    const executable = (
      await execFile('/usr/libexec/PlistBuddy', [
        '-c',
        'Print :CFBundleExecutable',
        infoPlistPath,
      ])
    ).stdout.trim()

    if (executable.length === 0) {
      throw new Error('Empty CFBundleExecutable value')
    }

    return Path.join(appPath, 'Contents', 'MacOS', executable)
  } catch (e) {
    log.error(
      `Failed to resolve executable path for ${editorName}`,
      e instanceof Error ? e : undefined
    )
    throw new ExternalEditorError(
      `Something went wrong while trying to start ${editorName}. Please open Settings and try another editor.`,
      { openPreferences: true }
    )
  }
}

// PyCharm on macOS can fail for root-level files such as README.md when a
// project path and file path are passed as separate plain arguments. Launching
// the project first and then passing a project-relative file path with
// `--line N` reliably opens both root and nested files in the correct window.
// The line argument also doubles as a jump target: when the caller knows what
// the user is looking at (e.g. the topmost changed line in a diff viewport),
// PyCharm opens the file at that line instead of at the top.
function getPyCharmFileArgs(
  targetPath: string,
  repositoryPath: string,
  line?: number
): ReadonlyArray<string> {
  const relativePath = Path.relative(repositoryPath, targetPath)

  if (
    relativePath.length === 0 ||
    relativePath === '..' ||
    relativePath.startsWith(`..${Path.sep}`) ||
    Path.isAbsolute(relativePath)
  ) {
    return [targetPath]
  }

  const projectRelativePath =
    relativePath.startsWith('.') || relativePath.startsWith(Path.sep)
      ? relativePath
      : `.${Path.sep}${relativePath}`

  const lineArg =
    line !== undefined && Number.isSafeInteger(line) && line > 0
      ? line.toString()
      : '1'

  return [repositoryPath, '--line', lineArg, projectRelativePath]
}

async function launchPyCharmOnDarwin(
  targetPath: string,
  editor: FoundEditor,
  repositoryPath?: string,
  line?: number
): Promise<void> {
  const executablePath = await getMacOSAppExecutablePath(
    editor.path,
    `'${editor.editor}'`
  )
  const args =
    repositoryPath !== undefined && repositoryPath !== targetPath
      ? getPyCharmFileArgs(targetPath, repositoryPath, line)
      : [targetPath]

  return launchEditor(
    executablePath,
    args,
    `'${editor.editor}'`,
    false,
    repositoryPath
  )
}

/**
 * Open a given file or folder in the desired external editor.
 *
 * @param fullPath A folder or file path to pass as an argument when launching the editor.
 * @param editor The external editor to launch.
 * @param repositoryPath The repository path to provide when the target is a file.
 * @param line One-based line number to jump to. Only honoured by editors that
 *  accept a line argument (currently PyCharm on macOS).
 */
export async function launchExternalEditor(
  fullPath: string,
  editor: FoundEditor,
  repositoryPath?: string,
  line?: number
): Promise<void> {
  if (__DARWIN__ && isPyCharmEditor(editor.editor)) {
    return launchPyCharmOnDarwin(fullPath, editor, repositoryPath, line)
  }

  return launchEditor(editor.path, [fullPath], `'${editor.editor}'`, __DARWIN__)
}

/**
 * Open a given file or folder in the desired custom external editor.
 *
 * @param fullPath A folder or file path to pass as an argument when launching the editor.
 * @param customEditor The external editor to launch.
 */
export const launchCustomExternalEditor = (
  fullPath: string,
  customEditor: ICustomIntegration
) => {
  const argv = parseCustomIntegrationArguments(customEditor.arguments)

  // Replace instances of RepoPathArgument with fullPath in customEditor.arguments
  const args = expandTargetPathArgument(argv, fullPath)

  // In macOS we can use `open` if it's an app (i.e. if we have a bundleID),
  // which will open the right executable file for us, we only need the path
  // to the editor .app folder.
  const spawnAsDarwinApp = __DARWIN__ && customEditor.bundleID !== undefined
  const editorName = `custom editor at path '${customEditor.path}'`

  return launchEditor(customEditor.path, args, editorName, spawnAsDarwinApp)
}
