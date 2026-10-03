'use client'

import { useRef, useState } from 'react'

/**
 * A date field you can type into.
 *
 * Drop-in replacement for <input type="date">: same value (YYYY-MM-DD or
 * empty), same onChange (handlers read e.target.value; nothing else on the
 * event is populated), same min/max/className/required/disabled.
 * The visible box takes DD/MM/YYYY typed on the keyboard (slashes added
 * as you go; a pasted 1985-03-12 or 1/3/1985 is understood too), and a
 * small calendar button opens the browser's own picker for anyone who
 * prefers it.
 *
 * Why: on Safari, iPad and recent Chrome builds the native date input only
 * offers a click-through picker, so a pharmacist entering a date of birth
 * had to click day, month and year separately (Moin, Smartway, 3 Oct 2026).
 *
 * Contract, kept identical to the native input so no clinical gate moves:
 *   - a complete, real calendar date is reported as ISO, even when it is
 *     outside min/max (the native input did the same and only flagged
 *     validity); the tools' own validators decide eligibility, this field
 *     just shows a warning
 *   - an incomplete or impossible date (31/02) is reported as '' so every
 *     existing "required" and age check keeps working unchanged
 */

type NativeProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'>

interface Props extends NativeProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/

function isoToDisplay(iso: string): string {
  const m = ISO.exec(iso || '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

function toIso(y: number, mo: number, d: number): string | null {
  if (y < 1900 || y > 2200) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function displayToIso(text: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text)
  return m ? toIso(Number(m[3]), Number(m[2]), Number(m[1])) : null
}

/**
 * What the user typed or pasted, normalised to DD/MM/YYYY where possible.
 * Accepts digits with slashes added as you go, an ISO date pasted from a
 * record, and d/m/yyyy without leading zeros.
 */
function normaliseTyping(raw: string): string {
  const t = raw.trim()
  const iso = ISO.exec(t)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  const loose = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(t)
  if (loose) return `${loose[1].padStart(2, '0')}/${loose[2].padStart(2, '0')}/${loose[3]}`
  const digits = t.replace(/\D/g, '').slice(0, 8)
  let out = digits.slice(0, 2)
  if (digits.length > 2) out += '/' + digits.slice(2, 4)
  if (digits.length > 4) out += '/' + digits.slice(4, 8)
  return out
}

export default function DateInput({ value, onChange, min, max, className, disabled, required, id, name, placeholder, onBlur, ...rest }: Props) {
  const [text, setText] = useState(isoToDisplay(value))
  const [seenValue, setSeenValue] = useState(value)
  const [touched, setTouched] = useState(false)
  const hidden = useRef<HTMLInputElement>(null)

  // External value changes (carry-forward, returning-patient selection, a
  // form reset) refresh the text. Done during render, React's "adjust state
  // on prop change" pattern, not in an effect. A value that already matches
  // what is typed is left alone so the caret stays put.
  if (value !== seenValue) {
    setSeenValue(value)
    if (displayToIso(text) !== (value || null)) {
      setText(isoToDisplay(value))
      if (!value) setTouched(false)
    }
  }

  const minS = typeof min === 'string' ? min : undefined
  const maxS = typeof max === 'string' ? max : undefined

  function emit(iso: string) {
    const el = hidden.current
    if (!el) return
    el.value = iso
    // Handlers only read e.target.value; hand them the hidden native input.
    onChange({ target: el, currentTarget: el } as unknown as React.ChangeEvent<HTMLInputElement>)
  }

  function outOfRange(iso: string): string | null {
    if (minS && iso < minS) return `Check this date: it is before ${isoToDisplay(minS)}`
    if (maxS && iso > maxS) return `Check this date: it is after ${isoToDisplay(maxS)}`
    return null
  }

  /** One path for typing, pasting and the picker. */
  function apply(raw: string) {
    const next = normaliseTyping(raw)
    setText(next)
    const iso = displayToIso(next)
    if (iso) {
      if (iso !== value) emit(iso)
    } else if (value) {
      emit('')
    }
  }

  const iso = displayToIso(text)
  const problem = touched && text.length > 0
    ? (!iso ? 'Enter a real date as DD/MM/YYYY' : outOfRange(iso))
    : null

  return (
    <div className="relative w-full">
      <input
        {...rest}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        pattern="\d{2}/\d{2}/\d{4}"
        placeholder={placeholder ?? 'DD/MM/YYYY'}
        value={text}
        disabled={disabled}
        required={required}
        onChange={(e) => apply(e.target.value)}
        onBlur={(e) => { setTouched(true); onBlur?.(e) }}
        aria-invalid={problem ? true : undefined}
        className={`${className ?? ''} pr-10 ${problem ? 'ring-2 ring-red-300' : ''}`}
      />
      {/* The browser's own picker, for those who want it. The native input
          sits invisibly over the calendar button so a click or tap opens
          it; it is hidden from assistive technology, which uses the typed
          box. */}
      <span className="absolute inset-y-0 right-0 flex items-center pr-1" aria-hidden="true">
        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            ref={hidden}
            type="date"
            tabIndex={-1}
            value={value || ''}
            min={minS}
            max={maxS}
            disabled={disabled}
            onChange={(e) => { setTouched(true); apply(isoToDisplay(e.target.value)) }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
      </span>
      {problem && <p className="mt-1 text-xs text-red-600">{problem}</p>}
    </div>
  )
}
