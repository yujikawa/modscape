import { useEffect, useRef, useState, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { AlertCircle, CheckCircle2, Loader2, Download, GitCompare } from 'lucide-react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark'
import { Transaction } from '@codemirror/state'
import { computeDiff } from '../../lib/diff'

const CONTEXT_LINES = 3

const EditorTab = () => {
  const {
    error,
    isCliMode,
    yamlInput,
    baselineYaml,
    baselineTimestamp,
    savingStatus,
    theme,
    currentModelSlug,
    availableFiles,
  } = useStore()

  const currentModelName = `${(availableFiles.find(f => f.slug === currentModelSlug) ?? availableFiles[0])?.name ?? 'model'}.yaml`

  const editorRef = useRef<ReactCodeMirrorRef>(null)
  const [diffMode, setDiffMode] = useState(false)

  // Sync store -> viewer on any yamlInput change
  useEffect(() => {
    if (!editorRef.current?.view) return;
    const view = editorRef.current.view;
    const currentDoc = view.state.doc.toString();
    if (currentDoc === yamlInput) return;
    view.dispatch({
      changes: { from: 0, to: currentDoc.length, insert: yamlInput },
      annotations: Transaction.addToHistory.of(false)
    });
  }, [yamlInput])

  // Clear content on file switch
  useEffect(() => {
    if (!editorRef.current?.view) return;
    const view = editorRef.current.view;
    const currentDoc = view.state.doc.toString();
    view.dispatch({
      changes: { from: 0, to: currentDoc.length, insert: yamlInput },
      annotations: Transaction.addToHistory.of(false)
    });
  }, [currentModelSlug])

  const diffLines = useMemo(() => {
    if (!diffMode) return null
    return computeDiff(baselineYaml, yamlInput)
  }, [diffMode, baselineYaml, yamlInput])

  const hasChanges = diffLines !== null && diffLines.some(l => l.type !== 'unchanged')

  const visibleSet = useMemo(() => {
    if (!diffLines) return null
    const visible = new Set<number>()
    diffLines.forEach((line, i) => {
      if (line.type !== 'unchanged') {
        for (let j = Math.max(0, i - CONTEXT_LINES); j <= Math.min(diffLines.length - 1, i + CONTEXT_LINES); j++) {
          visible.add(j)
        }
      }
    })
    return visible
  }, [diffLines])

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden p-4 pt-2 h-full sidebar-content">
      <div className="flex items-center justify-between px-1">
        {!isCliMode ? (
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-md">
            <AlertCircle size={12} className="text-blue-400" />
            <span className="text-[10px] text-blue-300 font-medium uppercase tracking-tight">Sandbox Mode</span>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Auto-sync active
              </span>
            </div>

            <div className="flex items-center gap-1.5 min-w-[60px]">
              {savingStatus === 'saving' && (
                <div className="flex items-center gap-1 text-slate-400 animate-pulse">
                  <Loader2 size={10} className="animate-spin" />
                  <span className="text-[9px] font-bold uppercase">Saving</span>
                </div>
              )}
              {savingStatus === 'saved' && (
                <div className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 size={10} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Saved</span>
                </div>
              )}
              {savingStatus === 'error' && (
                <div className="flex items-center gap-1 text-red-500">
                  <AlertCircle size={10} />
                  <span className="text-[9px] font-bold uppercase">Error</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          {/* Diff toggle */}
          <button
            onClick={() => setDiffMode(v => !v)}
            title={diffMode && baselineTimestamp ? `Comparing against snapshot loaded at ${new Date(baselineTimestamp).toLocaleTimeString()}` : 'Toggle Diff'}
            className={`flex items-center px-2 py-1 rounded transition-colors ${
              diffMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : theme === 'dark'
                  ? 'text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500'
                  : 'text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-400'
            }`}
          >
            <GitCompare size={12} />
          </button>

          {/* Download button */}
          <button
            onClick={() => {
              const blob = new Blob([yamlInput], { type: 'text/yaml' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = currentModelName
              a.click()
              URL.revokeObjectURL(url)
            }}
            title="Download YAML"
            className={`flex items-center px-2 py-1 rounded transition-colors ${
              theme === 'dark'
                ? 'text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500'
                : 'text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-400'
            }`}
          >
            <Download size={12} />
          </button>
        </div>
      </div>

      <div className={`relative flex-1 flex flex-col min-h-0 border rounded-md overflow-hidden transition-colors ${
        theme === 'dark' ? 'border-slate-700 bg-[#282c34]' : 'border-slate-200 bg-white'
      }`}>
        {diffMode ? (
          <div className="flex-1 overflow-auto text-[12px] font-mono leading-5">
            <div className={`px-3 py-1.5 text-[10px] border-b ${
              theme === 'dark' ? 'text-slate-500 border-slate-700 bg-slate-800/40' : 'text-slate-400 border-slate-200 bg-slate-50'
            }`}>
              Comparing against snapshot loaded at {baselineTimestamp ? new Date(baselineTimestamp).toLocaleTimeString() : '—'}
            </div>
            {!hasChanges ? (
              <div className={`flex items-center justify-center h-full text-[11px] font-medium ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                No changes
              </div>
            ) : (
              <table className="w-full border-collapse">
                <tbody>
                  {(() => {
                    const rows: React.ReactNode[] = []
                    let prevVisible = false
                    let oldNum = 0
                    let newNum = 0
                    diffLines!.forEach((line, i) => {
                      if (line.type !== 'added') oldNum++
                      if (line.type !== 'removed') newNum++
                      const isVisible = visibleSet!.has(i)
                      if (!isVisible) { prevVisible = false; return }
                      if (!prevVisible && rows.length > 0) {
                        rows.push(
                          <tr key={`sep-${i}`} className={theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-100'}>
                            <td className="select-none px-2 text-right text-[10px] text-slate-500 w-8">···</td>
                            <td className="select-none px-1 w-4 text-center text-slate-500">···</td>
                            <td className="px-2 text-slate-500 text-[11px]">···</td>
                          </tr>
                        )
                      }
                      const isAdded = line.type === 'added'
                      const isRemoved = line.type === 'removed'
                      rows.push(
                        <tr
                          key={i}
                          className={isAdded
                            ? theme === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-50'
                            : isRemoved
                              ? theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50'
                              : ''}
                        >
                          <td className={`select-none px-2 text-right text-[10px] w-8 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                            {isRemoved ? oldNum : newNum}
                          </td>
                          <td className={`select-none px-1 w-4 text-center ${
                            isAdded
                              ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                              : isRemoved
                                ? theme === 'dark' ? 'text-red-400' : 'text-red-600'
                                : 'text-transparent'
                          }`}>
                            {isAdded ? '+' : isRemoved ? '-' : ' '}
                          </td>
                          <td className={`px-2 py-0 whitespace-pre-wrap break-all ${
                            isAdded
                              ? theme === 'dark' ? 'text-emerald-300' : 'text-emerald-800'
                              : isRemoved
                                ? theme === 'dark' ? 'text-red-300' : 'text-red-800'
                                : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {line.content}
                          </td>
                        </tr>
                      )
                      prevVisible = true
                    })
                    return rows
                  })()}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <CodeMirror
            ref={editorRef}
            value={yamlInput}
            height="100%"
            theme={theme === 'dark' ? oneDark : 'light'}
            extensions={[yaml()]}
            readOnly={true}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: false,
            }}
            className="flex-1 text-sm overflow-auto"
          />
        )}

        {error && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-900/90 border border-red-500/50 rounded-md text-red-100 text-xs flex gap-2 items-start z-10 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-1 shrink-0">
        <div className="text-[10px] text-slate-500 italic">
          {isCliMode
            ? 'Read-only view. Edit YAML directly in your editor.'
            : 'Read-only view. Use the canvas to make changes.'}
        </div>
      </div>
    </div>
  )
}

export default EditorTab
