import { useState } from 'react'
import { X, Copy, RotateCw, HelpCircle } from 'lucide-react'

interface MissionKeyModalProps {
  isOpen: boolean
  currentKey: string
  onClose: () => void
  onKeyChange: (key: string) => void
}

function generateRandomKey(): string {
  return String(Math.floor(Math.random() * 9000) + 1000)
}

function isValidKey(key: string): boolean {
  return /^\d{4}$/.test(key) && parseInt(key) >= 1000 && parseInt(key) <= 9999
}

export default function MissionKeyModal({ isOpen, currentKey, onClose, onKeyChange }: MissionKeyModalProps) {
  const [inputKey, setInputKey] = useState('')
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setInputKey(val)
    setError('')
  }

  const handleEnterKey = () => {
    if (!inputKey) {
      setError('Please enter a 4-digit key')
      return
    }
    if (!isValidKey(inputKey)) {
      setError('Key must be 4 digits (1000-9999)')
      return
    }
    onKeyChange(inputKey)
    setInputKey('')
    onClose()
  }

  const handleGenerateKey = () => {
    const newKey = generateRandomKey()
    onKeyChange(newKey)
    setInputKey('')
    onClose()
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(currentKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass relative w-full max-w-sm rounded-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {!showForgot ? (
          <>
            <h2 className="text-2xl font-bold mb-6">Mission Access Key</h2>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-3">Current Mission</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-white font-mono font-bold">
                    {currentKey}
                  </div>
                  <button
                    onClick={handleCopyKey}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-gray-400 hover:text-white"
                    title={copied ? 'Copied!' : 'Copy key'}
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {currentKey === '1042' ? (
                    <>
                      <strong>Public demo workspace.</strong> Data is shared with other users. Generate a new key for a private workspace.
                    </>
                  ) : (
                    'Your personal workspace. History and memory are private to this key.'
                  )}
                </p>
              </div>

              <div className="border-t border-white/10 pt-6">
                <p className="text-sm text-gray-400 mb-3">Enter Existing Key</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={inputKey}
                    onChange={handleInputChange}
                    placeholder="0000"
                    className="flex-1 px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-white font-mono font-bold placeholder-gray-600 focus:outline-none focus:border-ios-blue transition"
                  />
                  <button
                    onClick={handleEnterKey}
                    disabled={!inputKey || !isValidKey(inputKey)}
                    className="px-4 py-2 rounded-lg bg-ios-blue text-white font-medium hover:bg-ios-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Switch
                  </button>
                </div>
                {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGenerateKey}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition font-medium"
                >
                  <RotateCw size={16} />
                  Generate New Private Workspace
                </button>
                <button
                  onClick={() => setShowForgot(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition text-sm"
                >
                  <HelpCircle size={14} />
                  Can&apos;t remember your key?
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Workspace Recovery</h2>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-gray-300 mb-3">
                  <strong>Each 4-digit key is a separate workspace</strong> with its own history and mission memory.
                </p>
                <p className="text-sm text-gray-400 mb-3">
                  If you generated a random key, you'll need to remember or find it to recover that workspace.
                </p>
                <p className="text-sm text-gray-400">
                  Suggestions:
                </p>
                <ul className="text-xs text-gray-400 mt-2 space-y-1 ml-4">
                  <li>• Write down any keys you create</li>
                  <li>• Share a key to collaborate on the same workspace</li>
                  <li>• Keys are stored in browser localStorage</li>
                  <li>• Use <code className="bg-black/50 px-1 rounded">1042</code> for public demo data</li>
                </ul>
              </div>

              <p className="text-xs text-gray-500 text-center">
                No centralized account system — your workspace data lives locally and on our backend, identified by your key.
              </p>

              <button
                onClick={() => setShowForgot(false)}
                className="w-full px-4 py-2 rounded-lg bg-ios-blue text-white font-medium hover:bg-ios-blue/90 transition"
              >
                Back to Workspace Selector
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
