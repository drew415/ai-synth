import { useState, useCallback, useMemo } from 'react'
import type { SynthParams } from '../../state/params'
import {
  FACTORY_PRESETS,
  loadUserPresets,
  saveUserPresets,
  exportPresets,
  importPresets,
  type Preset,
} from '../../state/presets'
import { Panel } from '../components/Panel'

interface PresetPanelProps {
  currentParams: SynthParams
  onLoadPreset: (params: SynthParams) => void
}

export function PresetPanel({ currentParams, onLoadPreset }: PresetPanelProps) {
  const [userPresets, setUserPresets] = useState<Preset[]>(() => loadUserPresets())
  const [selectedPreset, setSelectedPreset] = useState<string>('Init')
  const [newPresetName, setNewPresetName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  const allPresets = useMemo(() => [...FACTORY_PRESETS, ...userPresets], [userPresets])

  const handleSelectPreset = useCallback(
    (name: string) => {
      const preset = allPresets.find((p) => p.name === name)
      if (preset) {
        setSelectedPreset(name)
        onLoadPreset(preset.params)
      }
    },
    [allPresets, onLoadPreset]
  )

  const handleSavePreset = useCallback(() => {
    if (!newPresetName.trim()) return

    // Check if name already exists in user presets
    const existingIndex = userPresets.findIndex(
      (p) => p.name.toLowerCase() === newPresetName.trim().toLowerCase()
    )

    const newPreset: Preset = {
      name: newPresetName.trim(),
      params: { ...currentParams },
    }

    let updated: Preset[]
    if (existingIndex >= 0) {
      // Update existing
      updated = [...userPresets]
      updated[existingIndex] = newPreset
    } else {
      // Add new
      updated = [...userPresets, newPreset]
    }

    setUserPresets(updated)
    saveUserPresets(updated)
    setSelectedPreset(newPreset.name)
    setNewPresetName('')
    setShowSaveInput(false)
  }, [newPresetName, currentParams, userPresets])

  const handleDeletePreset = useCallback(
    (name: string) => {
      // Can't delete factory presets
      if (FACTORY_PRESETS.find((p) => p.name === name)) return

      const updated = userPresets.filter((p) => p.name !== name)
      setUserPresets(updated)
      saveUserPresets(updated)

      if (selectedPreset === name) {
        setSelectedPreset('Init')
        const initPreset = FACTORY_PRESETS.find((p) => p.name === 'Init')
        if (initPreset) {
          onLoadPreset(initPreset.params)
        }
      }
    },
    [userPresets, selectedPreset, onLoadPreset]
  )

  const handleExport = useCallback(() => {
    const json = exportPresets(userPresets)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-synth-presets.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [userPresets])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const json = e.target?.result as string
        const imported = importPresets(json)
        if (imported.length > 0) {
          const merged = [...userPresets]
          for (const preset of imported) {
            const existingIndex = merged.findIndex(
              (p) => p.name.toLowerCase() === preset.name.toLowerCase()
            )
            if (existingIndex >= 0) {
              merged[existingIndex] = preset
            } else {
              merged.push(preset)
            }
          }
          setUserPresets(merged)
          saveUserPresets(merged)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [userPresets])

  return (
    <Panel title="Presets">
      <div className="flex flex-col gap-3">
        {/* Preset selector */}
        <div className="flex gap-2">
          <select
            value={selectedPreset}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-2 py-1.5
              text-sm text-[var(--text-primary)] cursor-pointer
              hover:border-[var(--accent-hover)] focus:border-[var(--accent)] focus:outline-none"
          >
            <optgroup label="Factory">
              {FACTORY_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            {userPresets.length > 0 && (
              <optgroup label="User">
                {userPresets.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Delete button for user presets */}
          {userPresets.find((p) => p.name === selectedPreset) && (
            <button
              onClick={() => handleDeletePreset(selectedPreset)}
              className="px-2 py-1 text-sm text-red-500 hover:text-red-400 transition-colors"
              title="Delete preset"
            >
              Delete
            </button>
          )}
        </div>

        {/* Save preset */}
        {showSaveInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Preset name"
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-2 py-1.5
                text-sm text-[var(--text-primary)]
                focus:border-[var(--accent)] focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePreset()
                if (e.key === 'Escape') setShowSaveInput(false)
              }}
              autoFocus
            />
            <button
              onClick={handleSavePreset}
              disabled={!newPresetName.trim()}
              className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)]
                text-white text-sm rounded transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveInput(false)}
              className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setShowSaveInput(true)}
              className="flex-1 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border)]
                text-sm text-[var(--text-primary)] rounded
                hover:border-[var(--accent-hover)] transition-colors"
            >
              Save Preset
            </button>
            <button
              onClick={handleExport}
              disabled={userPresets.length === 0}
              className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border)]
                text-sm text-[var(--text-primary)] rounded
                hover:border-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              Export
            </button>
            <button
              onClick={handleImport}
              className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border)]
                text-sm text-[var(--text-primary)] rounded
                hover:border-[var(--accent-hover)] transition-colors"
            >
              Import
            </button>
          </div>
        )}
      </div>
    </Panel>
  )
}
