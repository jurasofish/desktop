import assert from 'node:assert'
import { afterEach, describe, it, mock } from 'node:test'

import {
  getOpenInExternalEditorAccelerator,
  isPyCharmEditor,
} from '../../src/lib/editors/pycharm'

const execFileCalls: Array<ReadonlyArray<string>> = []
const spawnCalls: Array<ReadonlyArray<string>> = []
const spawnOptionsCalls: Array<{ readonly cwd?: string }> = []

let execFileBehavior = async (
  command: string,
  args: ReadonlyArray<string>
): Promise<{ stdout: string; stderr: string }> => {
  execFileCalls.push([command, ...args])
  return { stdout: 'pycharm\n', stderr: '' }
}

mock.module('../../src/lib/exec-file', {
  namedExports: {
    execFile: (command: string, args: ReadonlyArray<string>) =>
      execFileBehavior(command, args),
  },
})

mock.module('../../src/lib/path-exists', {
  namedExports: {
    pathExists: async () => true,
  },
})

mock.module('child_process', {
  namedExports: {
    spawn: (
      command: string,
      args: ReadonlyArray<string>,
      options?: { cwd?: string }
    ) => {
      spawnCalls.push([command, ...args])
      spawnOptionsCalls.push({ cwd: options?.cwd })
      return {
        on: (event: string, cb: () => void) => {
          if (event === 'spawn') {
            cb()
          }
        },
        unref: () => {},
      }
    },
    exec: () => {
      throw new Error('child_process.exec should not be called in this test')
    },
    execFile: () => {
      throw new Error(
        'child_process.execFile should not be called in this test'
      )
    },
  },
})

afterEach(() => {
  execFileCalls.length = 0
  spawnCalls.length = 0
  spawnOptionsCalls.length = 0
  execFileBehavior = async (
    command: string,
    args: ReadonlyArray<string>
  ): Promise<{ stdout: string; stderr: string }> => {
    execFileCalls.push([command, ...args])
    return { stdout: 'pycharm\n', stderr: '' }
  }
})

describe('pycharm helpers', () => {
  it('detects supported PyCharm editor names', () => {
    assert.equal(isPyCharmEditor('PyCharm'), true)
    assert.equal(isPyCharmEditor('PyCharm Community Edition'), true)
    assert.equal(isPyCharmEditor('Visual Studio Code'), false)
    assert.equal(isPyCharmEditor(null), false)
  })

  it('uses Ctrl+E for PyCharm on macOS and default shortcut otherwise', () => {
    if (__DARWIN__) {
      assert.equal(getOpenInExternalEditorAccelerator('PyCharm'), 'Ctrl+E')
      assert.equal(
        getOpenInExternalEditorAccelerator('PyCharm Community Edition'),
        'Ctrl+E'
      )
      assert.equal(
        getOpenInExternalEditorAccelerator('Visual Studio Code'),
        'CmdOrCtrl+Shift+A'
      )
    } else {
      assert.equal(
        getOpenInExternalEditorAccelerator('PyCharm'),
        'CmdOrCtrl+Shift+A'
      )
    }
  })

  it('launches PyCharm files with repository context on macOS', async () => {
    if (!__DARWIN__) {
      return
    }

    const { launchExternalEditor } = await import(
      '../../src/lib/editors/launch'
    )
    await launchExternalEditor(
      '/tmp/repo/src/index.ts',
      { editor: 'PyCharm', path: '/Applications/PyCharm.app' },
      '/tmp/repo'
    )

    assert.deepEqual(execFileCalls, [
      [
        '/usr/libexec/PlistBuddy',
        '-c',
        'Print :CFBundleExecutable',
        '/Applications/PyCharm.app/Contents/Info.plist',
      ],
    ])
    assert.deepEqual(spawnCalls, [
      [
        '/Applications/PyCharm.app/Contents/MacOS/pycharm',
        '/tmp/repo',
        '--line',
        '1',
        './src/index.ts',
      ],
    ])
    assert.deepEqual(spawnOptionsCalls, [{ cwd: '/tmp/repo' }])
  })

  it('launches PyCharm root files with a line argument on macOS', async () => {
    if (!__DARWIN__) {
      return
    }

    const { launchExternalEditor } = await import(
      '../../src/lib/editors/launch'
    )
    await launchExternalEditor(
      '/tmp/repo/README.md',
      { editor: 'PyCharm', path: '/Applications/PyCharm.app' },
      '/tmp/repo'
    )

    assert.deepEqual(spawnCalls, [
      [
        '/Applications/PyCharm.app/Contents/MacOS/pycharm',
        '/tmp/repo',
        '--line',
        '1',
        './README.md',
      ],
    ])
    assert.deepEqual(spawnOptionsCalls, [{ cwd: '/tmp/repo' }])
  })

  it('passes the requested line number to PyCharm on macOS', async () => {
    if (!__DARWIN__) {
      return
    }

    const { launchExternalEditor } = await import(
      '../../src/lib/editors/launch'
    )
    await launchExternalEditor(
      '/tmp/repo/src/index.ts',
      { editor: 'PyCharm', path: '/Applications/PyCharm.app' },
      '/tmp/repo',
      42
    )

    assert.deepEqual(spawnCalls, [
      [
        '/Applications/PyCharm.app/Contents/MacOS/pycharm',
        '/tmp/repo',
        '--line',
        '42',
        './src/index.ts',
      ],
    ])
  })

  it('falls back to --line 1 when the requested line is invalid on macOS', async () => {
    if (!__DARWIN__) {
      return
    }

    const { launchExternalEditor } = await import(
      '../../src/lib/editors/launch'
    )

    for (const invalidLine of [0, -1, 1.5, NaN, Infinity]) {
      await launchExternalEditor(
        '/tmp/repo/src/index.ts',
        { editor: 'PyCharm', path: '/Applications/PyCharm.app' },
        '/tmp/repo',
        invalidLine
      )
    }

    for (const call of spawnCalls) {
      assert.deepEqual(call, [
        '/Applications/PyCharm.app/Contents/MacOS/pycharm',
        '/tmp/repo',
        '--line',
        '1',
        './src/index.ts',
      ])
    }
  })

  it('launches PyCharm repositories without redundant file context on macOS', async () => {
    if (!__DARWIN__) {
      return
    }

    const { launchExternalEditor } = await import(
      '../../src/lib/editors/launch'
    )
    await launchExternalEditor('/tmp/repo', {
      editor: 'PyCharm',
      path: '/Applications/PyCharm.app',
    })

    assert.deepEqual(spawnCalls, [
      ['/Applications/PyCharm.app/Contents/MacOS/pycharm', '/tmp/repo'],
    ])
    assert.deepEqual(spawnOptionsCalls, [{ cwd: undefined }])
  })

  it('wraps executable-resolution failures in ExternalEditorError on macOS', async () => {
    if (!__DARWIN__) {
      return
    }

    execFileBehavior = async () => {
      throw new Error('boom')
    }

    const { launchExternalEditor } = await import(
      '../../src/lib/editors/launch'
    )
    const { ExternalEditorError } = await import('../../src/lib/editors/shared')

    await assert.rejects(
      launchExternalEditor('/tmp/repo', {
        editor: 'PyCharm',
        path: '/Applications/PyCharm.app',
      }),
      ExternalEditorError
    )
  })
})
