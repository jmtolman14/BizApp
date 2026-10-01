import { useState } from 'react'
import { PrimaryButton } from './ui'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older iOS / insecure contexts: fall back to a hidden textarea.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export default function ShareButton({ text }: { text: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  const flash = (s: 'copied') => {
    setStatus(s)
    window.setTimeout(() => setStatus('idle'), 2200)
  }

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch (err) {
        // The player closed the share sheet: nothing to do.
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    if (await copyText(text)) flash('copied')
    else setStatus('failed') // stays visible so the text can be copied by hand
  }

  return (
    <div>
      <PrimaryButton onClick={share}>
        {status === 'copied' ? 'Copied to clipboard' : 'Share score'}
      </PrimaryButton>
      {status === 'failed' && (
        <p role="alert" className="mt-3 text-sm text-band-orange">
          Copying didn't work here. Select the text below and copy it yourself.
        </p>
      )}
      {status === 'failed' && (
        <pre className="mt-2 rounded-xl bg-panel p-3 text-sm whitespace-pre-wrap select-all">{text}</pre>
      )}
    </div>
  )
}
