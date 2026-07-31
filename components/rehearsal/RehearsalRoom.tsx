'use client'

/**
 * RehearsalRoom
 *
 * The full Rehearsal Room experience in three stages:
 *   1. scenario-select: choose a built-in scenario to practice
 *   2. session-active: live conversation with the AI partner
 *   3. scorecard: scorecard with animated bars after session ends
 *
 * Voice path (Web Speech API):
 *   Feature-detected on mount. If supported, user is offered voice mode in
 *   context (not upfront), mic permission is requested only when they click
 *   "Enable voice". If denied or unsupported, text path remains fully functional.
 *   SpeechSynthesis reads AI turns aloud when voice is active.
 *
 * Text path: always available, full parity with voice path.
 *
 * Accessibility:
 *   - Transcript panel is aria-live="polite" so new turns are announced
 *   - aria-busy on the AI thinking state
 *   - Mic permission prompt appears in context, not as a modal
 *   - All interactive elements are real buttons or inputs
 *   - Focus moves to transcript h2 after session starts
 *   - Score card h2 receives focus when scorecard appears
 *   - prefers-reduced-motion respected in scorecard bars (Scorecard component)
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
} from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { ScorecardResult } from '@convex/rehearsalAction'
import { Button } from '@/components/ui/Button'
import { Scorecard } from '@/components/rehearsal/Scorecard'
import type { SupportedLocale } from '@/i18n/routing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Stage = 'scenario-select' | 'session-active' | 'scorecard'
type ScenarioKey = 'ask_raise' | 'negotiate_offer' | 'handle_deflection' | 'negotiate_promotion'
type VoiceState = 'idle' | 'listening' | 'processing'
type MicState = 'unknown' | 'prompted' | 'granted' | 'denied' | 'unsupported'

interface Turn {
  _id: Id<'rehearsalTurns'>
  role: string
  content: string
  createdAt: number
}

// ---------------------------------------------------------------------------
// Built-in scenario display data (display text comes from i18n)
// ---------------------------------------------------------------------------

const SCENARIOS: ScenarioKey[] = [
  'ask_raise',
  'negotiate_offer',
  'handle_deflection',
  'negotiate_promotion',
]

const SCENARIO_TITLE_KEYS: Record<ScenarioKey, 'scenario_ask_raise_title' | 'scenario_negotiate_offer_title' | 'scenario_handle_deflection_title' | 'scenario_negotiate_promotion_title'> = {
  ask_raise: 'scenario_ask_raise_title',
  negotiate_offer: 'scenario_negotiate_offer_title',
  handle_deflection: 'scenario_handle_deflection_title',
  negotiate_promotion: 'scenario_negotiate_promotion_title',
}

const SCENARIO_DESC_KEYS: Record<ScenarioKey, 'scenario_ask_raise_desc' | 'scenario_negotiate_offer_desc' | 'scenario_handle_deflection_desc' | 'scenario_negotiate_promotion_desc'> = {
  ask_raise: 'scenario_ask_raise_desc',
  negotiate_offer: 'scenario_negotiate_offer_desc',
  handle_deflection: 'scenario_handle_deflection_desc',
  negotiate_promotion: 'scenario_negotiate_promotion_desc',
}

/** Converts a raw scenario key like "ask_raise" into a readable title like "Ask Raise". */
function formatScenarioKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ---------------------------------------------------------------------------
// Web Speech API detection helpers
// ---------------------------------------------------------------------------

// Web Speech API types are not universally in lib.dom.d.ts; use a local interface.
interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: unknown) => void) | null
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
}

interface SpeechRecognitionResultEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult | undefined
  length: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative | undefined
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
}

function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  if ('SpeechRecognition' in window) return w.SpeechRecognition as SpeechRecognitionConstructor
  if ('webkitSpeechRecognition' in window) return w.webkitSpeechRecognition as SpeechRecognitionConstructor
  return null
}

// Map our locale code to BCP 47 for SpeechRecognition.lang
const LOCALE_TO_BCP47: Record<SupportedLocale, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  pt: 'pt-BR',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RehearsalRoom() {
  const t = useTranslations('rehearsal')
  const locale = useLocale() as SupportedLocale

  // ── Stage ─────────────────────────────────────────────────────────────────
  const [stage, setStage] = useState<Stage>('scenario-select')
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey | null>(null)
  const [sessionId, setSessionId] = useState<Id<'rehearsalSessions'> | null>(null)

  // ── Voice state ───────────────────────────────────────────────────────────
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [micState, setMicState] = useState<MicState>('unknown')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [voiceErrorRetryable, setVoiceErrorRetryable] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const retryCountRef = useRef(0)
  const MAX_AUTO_RETRIES = 2
  // Tracks latest interim text for use inside async callbacks (avoids stale closure)
  const interimTranscriptRef = useRef('')
  // Set to true when we stop recognition intentionally (to suppress onend restart)
  const intentionalStopRef = useRef(false)
  // Silence detection timer: submits interim text if no speech for 2s
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Text input ────────────────────────────────────────────────────────────
  const [textInput, setTextInput] = useState('')

  // ── AI thinking ───────────────────────────────────────────────────────────
  const [aiThinking, setAiThinking] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // ── Scorecard ─────────────────────────────────────────────────────────────
  const [scorecardData, setScorecardData] = useState<ScorecardResult | null>(null)
  const [scorecardLoading, setScorecardLoading] = useState(false)
  const [scorecardError, setScorecardError] = useState<string | null>(null)

  // ── Convex ────────────────────────────────────────────────────────────────
  const turns = useQuery(
    api.rehearsal.listTurns,
    sessionId ? { sessionId } : 'skip'
  ) as Turn[] | undefined

  const createSession = useMutation(api.rehearsal.createSession)
  const addUserTurnMutation = useMutation(api.rehearsal.addUserTurn)
  const generateAITurn = useAction(api.rehearsalAction.generateAITurn)
  const generateScorecard = useAction(api.rehearsalAction.generateScorecard)
  const completeSession = useMutation(api.rehearsal.completeSession)
  const pastSessions = useQuery(api.rehearsal.listSessions, { limit: 5 })

  // ── Refs for focus management ──────────────────────────────────────────────
  const transcriptRef = useRef<HTMLElement>(null)
  const scorecardRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const inputId = useId()

  // ── Feature detect voice support ──────────────────────────────────────────
  useEffect(() => {
    setVoiceSupported(isSpeechRecognitionSupported())
  }, [])

  // ── Auto-scroll transcript to bottom ──────────────────────────────────────
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [turns])

  // ── Focus management on stage change ──────────────────────────────────────
  useEffect(() => {
    if (stage === 'session-active') {
      setTimeout(() => {
        transcriptRef.current?.focus()
      }, 100)
    }
    if (stage === 'scorecard') {
      setTimeout(() => {
        scorecardRef.current?.focus()
      }, 100)
    }
  }, [stage])

  // ── Cleanup recognition on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleStartSession(scenarioKey: ScenarioKey) {
    setSelectedScenario(scenarioKey)
    setAiError(null)

    try {
      const id = await createSession({ scenarioKey, language: locale })
      setSessionId(id)
      setStage('session-active')

      // Trigger the AI opening turn
      setAiThinking(true)
      try {
        await generateAITurn({ sessionId: id })
      } catch {
        setAiError(t('error_ai'))
      } finally {
        setAiThinking(false)
      }
    } catch {
      setAiError(t('error_generic'))
    }
  }

  async function submitUserTurn(content: string, inputMode: 'voice' | 'text') {
    if (!sessionId || !content.trim() || aiThinking) return

    setAiError(null)
    setAiThinking(true)
    setTextInput('')

    try {
      await addUserTurnMutation({
        sessionId,
        content: content.trim(),
        inputMode,
      })

      await generateAITurn({ sessionId })

      // If voice is active, synthesize the AI's response
      if (voiceActive && turns) {
        // The new AI turn will appear via Convex query; we'll read the last AI turn
        // TTS is triggered by the turns update effect below
      }
    } catch {
      setAiError(t('error_ai'))
    } finally {
      setAiThinking(false)
    }
  }

  // Speak the latest AI turn when it changes (voice mode only)
  const lastAITurnContent = turns?.filter((t) => t.role === 'ai').at(-1)?.content
  const spokenRef = useRef<string | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  // Load voices (they load asynchronously in Chrome)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        setAvailableVoices(voices)
        console.log('[TTS] Loaded', voices.length, 'voices')
        // Log available English voices for debugging
        const englishVoices = voices.filter(v => v.lang.startsWith('en'))
        console.log('[TTS] English voices:', englishVoices.map(v => `${v.name} (${v.lang})`))
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // Select the best voice for speaking
  const getBestVoice = useCallback((langPrefix: string): SpeechSynthesisVoice | null => {
    const matchingVoices = availableVoices.filter((v) => v.lang.startsWith(langPrefix))

    if (matchingVoices.length === 0) {
      console.log('[TTS] No voices for language:', langPrefix)
      return null
    }

    // Priority list for high-quality voices (macOS/Chrome/Windows)
    const highQualityNames = [
      'samantha', 'ava', 'allison', 'zoe', 'joana', 'susan', 'kate', 'serena', // macOS premium
      'google us english', 'google uk english female', // Chrome
      'microsoft zira', 'microsoft aria', 'jenny', // Windows neural
      'enhanced', 'premium', 'natural', 'neural'
    ]

    // Try to find a high-quality voice
    for (const name of highQualityNames) {
      const found = matchingVoices.find(v => v.name.toLowerCase().includes(name))
      if (found) {
        console.log('[TTS] Selected voice:', found.name)
        return found
      }
    }

    // Prefer non-default voices as they tend to be higher quality
    const nonDefault = matchingVoices.find(v => !v.default)
    if (nonDefault) {
      console.log('[TTS] Using non-default voice:', nonDefault.name)
      return nonDefault
    }

    console.log('[TTS] Using fallback voice:', matchingVoices[0]?.name)
    return matchingVoices[0] || null
  }, [availableVoices])

  // Split text into natural sentence chunks for conversational TTS pacing
  const splitIntoSentences = useCallback((text: string): string[] => {
    const raw = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text]
    return raw.map(s => s.trim()).filter(s => s.length > 0)
  }, [])

  // Speak text chunked by sentence with short pauses between each for natural rhythm
  const speakChunked = useCallback((
    text: string,
    voice: SpeechSynthesisVoice | null,
    bcp47: string,
    onDone: () => void
  ) => {
    const sentences = splitIntoSentences(text)

    const speakNext = (index: number) => {
      if (index >= sentences.length) {
        onDone()
        return
      }

      const utter = new SpeechSynthesisUtterance(sentences[index])
      if (voice) utter.voice = voice
      utter.lang = bcp47
      utter.rate = 0.9
      utter.pitch = 1.05

      utter.onend = () => {
        if (index < sentences.length - 1) {
          // 200-400ms natural pause between sentences
          setTimeout(() => speakNext(index + 1), 200 + Math.random() * 200)
        } else {
          onDone()
        }
      }

      utter.onerror = () => {
        // Skip failed chunk and continue
        setTimeout(() => speakNext(index + 1), 100)
      }

      window.speechSynthesis.speak(utter)
    }

    speakNext(0)
  }, [splitIntoSentences])

  useEffect(() => {
    if (!voiceActive || !lastAITurnContent) return
    if (lastAITurnContent === spokenRef.current) return
    if (availableVoices.length === 0) {
      console.log('[TTS] Voices not loaded yet, waiting...')
      return
    }
    spokenRef.current = lastAITurnContent

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const bcp47 = LOCALE_TO_BCP47[locale]
      const langPrefix = bcp47.split('-')[0]
      const selectedVoice = getBestVoice(langPrefix)

      speakChunked(lastAITurnContent, selectedVoice, bcp47, () => {
        if (voiceActive && !aiThinking) {
          startListening()
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAITurnContent, voiceActive, availableVoices, getBestVoice, speakChunked])

  // ── Voice permission flow ─────────────────────────────────────────────────

  async function requestMicPermission() {
    setMicState('prompted')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setMicState('granted')
      setVoiceActive(true)
      startListening()
    } catch (err) {
      setMicState('denied')
      setVoiceActive(false)
    }
  }

  function declineMic() {
    setMicState('denied')
    setVoiceActive(false)
  }

  // ── Speech recognition ────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) {
      console.warn('[Rehearsal] SpeechRecognition not available')
      return
    }

    recognitionRef.current?.abort()

    const rec = new SR()
    rec.lang = LOCALE_TO_BCP47[locale]
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      console.log('[Rehearsal] Speech recognition started')
      setVoiceState('listening')
    }
    rec.onend = () => {
      console.log('[Rehearsal] Speech recognition ended')
      setVoiceState('idle')
      setInterimTranscript('')
      interimTranscriptRef.current = ''
      // Clear any pending silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      if (intentionalStopRef.current) {
        // We stopped deliberately (after final result or manual stop) — don't restart
        intentionalStopRef.current = false
        return
      }
      // Browser ended unexpectedly (long-silence timeout) — restart if still in voice mode
      if (voiceActive && !aiThinking) {
        setTimeout(() => {
          if (voiceActive && !aiThinking) {
            startListening()
          }
        }, 300)
      }
    }
    rec.onerror = (event: unknown) => {
      const errorEvent = event as { error?: string; message?: string }
      const errorCode = errorEvent.error ?? 'unknown'
      console.warn('[Rehearsal] Speech recognition error:', errorCode, {
        isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : 'n/a',
        protocol: typeof window !== 'undefined' ? window.location.protocol : 'n/a',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a',
        retryCount: retryCountRef.current,
      })
      // Clear interim text and silence timer on any error
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      setInterimTranscript('')
      interimTranscriptRef.current = ''
      setVoiceState('idle')

      if (errorCode === 'network') {
        const isSecure = typeof window !== 'undefined' && window.isSecureContext

        if (!isSecure) {
          // Genuine HTTPS issue — no point retrying
          setVoiceError(t('voice_error_https'))
          setVoiceErrorRetryable(false)
          setVoiceActive(false)
        } else if (retryCountRef.current < MAX_AUTO_RETRIES) {
          // Transient connectivity blip — auto-retry silently
          retryCountRef.current += 1
          const attempt = retryCountRef.current
          console.log(`[Rehearsal] Network error, auto-retry ${attempt}/${MAX_AUTO_RETRIES}`)
          setVoiceError(t('voice_error_network_retrying', { attempt, max: MAX_AUTO_RETRIES }))
          setVoiceErrorRetryable(false)
          setTimeout(() => {
            if (voiceActive && !aiThinking) {
              startListening()
            }
          }, 1500 * attempt)
        } else {
          // Exhausted retries — let user decide
          console.warn('[Rehearsal] Network error persists after retries — disabling voice')
          setVoiceError(t('voice_error_network'))
          setVoiceErrorRetryable(true)
          setVoiceActive(false)
        }
      } else if (errorCode === 'not-allowed') {
        console.warn('[Rehearsal] Microphone permission denied by user or browser policy')
        setVoiceError(t('voice_error_mic_denied'))
        setVoiceErrorRetryable(false)
        setVoiceActive(false)
        setMicState('denied')
      } else if (errorCode === 'no-speech' && voiceActive) {
        // Silence timeout — restart quietly
        setVoiceError(null)
        setTimeout(() => {
          if (voiceActive && !aiThinking) {
            startListening()
          }
        }, 500)
      } else if (errorCode === 'aborted') {
        // Intentional abort — no error
        setVoiceError(null)
      } else if (errorCode === 'audio-capture') {
        setVoiceError(t('voice_error_audio_capture'))
        setVoiceErrorRetryable(true)
        setVoiceActive(false)
      } else if (errorCode === 'service-not-allowed') {
        setVoiceError(t('voice_error_service_not_allowed'))
        setVoiceErrorRetryable(false)
        setVoiceActive(false)
      } else {
        console.warn('[Rehearsal] Unhandled speech recognition error code:', errorCode)
        setVoiceError(t('voice_error_generic', { code: errorCode }))
        setVoiceErrorRetryable(true)
        setVoiceActive(false)
      }
    }
    rec.onresult = (event: SpeechRecognitionResultEvent) => {
      // Accumulate interim and final text from the new results since resultIndex
      let interimText = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result?.[0]?.transcript ?? ''
        if (result?.isFinal) {
          finalText += text
        } else {
          interimText += text
        }
      }

      console.log('[Rehearsal] Got transcript — interim:', JSON.stringify(interimText), 'final:', JSON.stringify(finalText))

      // Reset the silence timer on any speech activity
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }

      if (finalText.trim()) {
        // Final result: stop continuous recognition and submit
        setInterimTranscript('')
        interimTranscriptRef.current = ''
        setVoiceState('processing')
        intentionalStopRef.current = true
        recognitionRef.current?.stop()
        submitUserTurn(finalText.trim(), 'voice')
      } else if (interimText.trim()) {
        // Interim result: show real-time transcription in the input area
        setInterimTranscript(interimText)
        interimTranscriptRef.current = interimText

        // Silence detection: if no new results arrive within 2s, treat as final
        silenceTimerRef.current = setTimeout(() => {
          const pending = interimTranscriptRef.current.trim()
          if (pending) {
            setInterimTranscript('')
            interimTranscriptRef.current = ''
            setVoiceState('processing')
            intentionalStopRef.current = true
            recognitionRef.current?.stop()
            submitUserTurn(pending, 'voice')
          }
        }, 2000)
      }
    }

    recognitionRef.current = rec

    try {
      rec.start()
    } catch (err) {
      console.error('[Rehearsal] Failed to start recognition:', err)
      setVoiceState('idle')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, voiceActive, aiThinking])

  function stopListening() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setInterimTranscript('')
    interimTranscriptRef.current = ''
    intentionalStopRef.current = true
    recognitionRef.current?.stop()
    setVoiceState('idle')
  }

  function retryVoice() {
    retryCountRef.current = 0
    setVoiceError(null)
    setVoiceErrorRetryable(false)
    setInterimTranscript('')
    interimTranscriptRef.current = ''
    setVoiceActive(true)
    startListening()
  }

  function dismissVoiceError() {
    setVoiceError(null)
    setVoiceErrorRetryable(false)
  }

  function toggleVoice() {
    if (voiceActive) {
      stopListening()
      window.speechSynthesis?.cancel()
      setVoiceActive(false)
      setVoiceState('idle')
      setInterimTranscript('')
      interimTranscriptRef.current = ''
    } else if (micState === 'granted') {
      retryCountRef.current = 0
      setVoiceError(null)
      setVoiceErrorRetryable(false)
      setVoiceActive(true)
      startListening()
    } else if (micState === 'unknown') {
      requestMicPermission()
    }
  }

  // ── Text submit ───────────────────────────────────────────────────────────

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    submitUserTurn(textInput, 'text')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitUserTurn(textInput, 'text')
    }
  }

  // ── End session / scorecard ───────────────────────────────────────────────

  async function handleEndSession() {
    if (!sessionId) return
    setScorecardLoading(true)
    setScorecardError(null)

    try {
      const result = await generateScorecard({ sessionId })
      setScorecardData(result)
      await completeSession({ sessionId, scorecard: result })
      setStage('scorecard')
    } catch {
      setScorecardError(t('error_scorecard'))
      setScorecardLoading(false)
    }
  }

  function handleTryAgain() {
    if (!selectedScenario) {
      handleReset()
      return
    }
    // Reset state then start a new session for the same scenario
    setSessionId(null)
    setScorecardData(null)
    setScorecardError(null)
    setScorecardLoading(false)
    setAiError(null)
    setTextInput('')
    setVoiceState('idle')
    spokenRef.current = null
    window.speechSynthesis?.cancel()
    // handleStartSession sets stage to 'session-active' itself
    handleStartSession(selectedScenario)
  }

  function handleContinueSession(existingSessionId: Id<'rehearsalSessions'>, scenarioKey: string) {
    // Continue an existing in-progress session
    setSessionId(existingSessionId)
    setSelectedScenario(scenarioKey as ScenarioKey)
    setScorecardData(null)
    setScorecardError(null)
    setScorecardLoading(false)
    setAiError(null)
    setTextInput('')
    setVoiceState('idle')
    spokenRef.current = null
    setStage('session-active')
  }

  function handleReset() {
    recognitionRef.current?.abort()
    window.speechSynthesis?.cancel()
    setStage('scenario-select')
    setSelectedScenario(null)
    setSessionId(null)
    setScorecardData(null)
    setScorecardError(null)
    setScorecardLoading(false)
    setAiError(null)
    setTextInput('')
    setVoiceState('idle')
    setVoiceActive(false)
    spokenRef.current = null
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const hasMinTurns = (turns?.filter((t) => t.role === 'user').length ?? 0) >= 1

  // ---------------------------------------------------------------------------
  // Stage: scenario-select
  // ---------------------------------------------------------------------------

  if (stage === 'scenario-select') {
    return (
      <div className="space-y-8">
        {/* Scenario picker */}
        <section aria-labelledby="scenarios-heading">
          <h2
            id="scenarios-heading"
            className="text-subhead font-bold text-ink mb-1"
          >
            {t('scenarios_heading')}
          </h2>
          <p className="text-body text-ink-soft mb-5">{t('scenarios_subheading')}</p>

          <div className="grid gap-3">
            {SCENARIOS.map((key) => (
              <ScenarioCard
                key={key}
                scenarioKey={key}
                title={t(SCENARIO_TITLE_KEYS[key])}
                description={t(SCENARIO_DESC_KEYS[key])}
                onSelect={() => handleStartSession(key)}
              />
            ))}
          </div>
        </section>

        {/* Past sessions */}
        {pastSessions && pastSessions.length > 0 && (
          <section aria-labelledby="past-sessions-heading">
            <h2
              id="past-sessions-heading"
              className="text-subhead font-bold text-ink mb-4"
            >
              {t('past_sessions_heading')}
            </h2>
            <ul className="space-y-2">
              {pastSessions.map((session) => (
                <li key={session._id}>
                  <PastSessionRow
                    session={session}
                    t={t}
                    locale={locale}
                    onContinue={session.status === 'in_progress' ? handleContinueSession : undefined}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {aiError && (
          <p role="alert" className="text-body text-error">
            {aiError}
          </p>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Stage: session-active
  // ---------------------------------------------------------------------------

  if (stage === 'session-active') {
    return (
      <div className="space-y-6">
        {/* Session header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-caption text-ink-soft underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm"
          >
            {t('back_to_scenarios')}
          </button>
          {selectedScenario && (
            <span className="text-caption text-ink-soft">
              {t(SCENARIO_TITLE_KEYS[selectedScenario])}
            </span>
          )}
        </div>

        {/* Mic permission prompt: in context, not as a modal */}
        {voiceSupported && micState === 'unknown' && stage === 'session-active' && (
          <MicPrompt
            title={t('mic_prompt_title')}
            body={t('mic_prompt_body')}
            grantLabel={t('mic_permission_grant')}
            denyLabel={t('mic_permission_deny')}
            onGrant={requestMicPermission}
            onDeny={declineMic}
          />
        )}

        {!voiceSupported && (
          <p
            role="status"
            className="text-caption text-ink-soft border border-border rounded-lg px-4 py-3"
          >
            {t('mic_not_supported')}
          </p>
        )}

        {micState === 'denied' && voiceActive === false && voiceSupported && (
          <p className="text-caption text-ink-soft">{t('mic_permission_denied_body')}</p>
        )}

        {/* Transcript */}
        <section
          aria-labelledby="transcript-heading"
          aria-live="polite"
          aria-busy={aiThinking ? "true" : "false"}
          ref={transcriptRef}
          tabIndex={-1}
          className="min-h-[320px] max-h-[480px] overflow-y-auto rounded-lg border border-border bg-surface p-4 space-y-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
        >
          <h2 id="transcript-heading" className="sr-only">
            {t('transcript_label')}
          </h2>

          {/* Empty state */}
          {(!turns || turns.length === 0) && !aiThinking && (
            <p className="text-body text-ink-soft text-center py-8">
              {t('loading')}
            </p>
          )}

          {/* Turns */}
          {turns?.map((turn) => (
            <TurnBubble
              key={turn._id}
              role={turn.role as 'user' | 'ai'}
              content={turn.content}
              youLabel={t('you')}
              aiLabel={t('ai_partner')}
            />
          ))}

          {/* AI thinking indicator */}
          {aiThinking && (
            <div aria-live="polite" className="flex gap-2 items-start">
              <span className="text-caption font-bold text-ink-muted shrink-0 pt-0.5">
                {t('ai_partner')}
              </span>
              <span className="flex gap-1 items-center pt-1">
                <ThinkingDots />
                <span className="sr-only">{t('processing')}</span>
              </span>
            </div>
          )}

          <div ref={transcriptEndRef} aria-hidden="true" />
        </section>

        {/* AI error */}
        {aiError && (
          <p role="alert" className="text-caption text-error">
            {aiError}
          </p>
        )}

        {/* Voice error */}
        {voiceError && (
          <div role="alert" className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-caption text-amber-800">{voiceError}</p>
            <p className="text-caption text-amber-600 mt-1">{t('voice_error_text_fallback')}</p>
            <div className="flex gap-2 mt-2">
              {voiceErrorRetryable && (
                <button
                  type="button"
                  onClick={retryVoice}
                  className="text-caption font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
                >
                  {t('voice_error_retry')}
                </button>
              )}
              <button
                type="button"
                onClick={dismissVoiceError}
                className="text-caption text-amber-600 underline underline-offset-2 hover:text-amber-700"
              >
                {t('voice_error_dismiss')}
              </button>
            </div>
          </div>
        )}

        {/* Voice controls */}
        {voiceActive && (
          <div className="flex items-center justify-between rounded-lg bg-accent/10 border border-accent/30 px-4 py-3">
            <span
              aria-live="polite"
              className="text-body font-semibold text-ink flex items-center gap-2"
            >
              {voiceState === 'listening' && (
                <>
                  <VoicePulse />
                  {t('listening')}
                </>
              )}
              {voiceState === 'processing' && t('processing')}
              {voiceState === 'idle' && t('voice_mode')}
            </span>
            <div className="flex gap-2">
              {voiceState === 'listening' && (
                <Button
                  label={t('stop_listening')}
                  variant="secondary"
                  onClick={stopListening}
                  className="py-2 px-4 text-caption"
                />
              )}
              <Button
                label={t('text_mode')}
                variant="ghost"
                onClick={toggleVoice}
                className="py-2 px-3 text-caption"
              />
            </div>
          </div>
        )}

        {/* Text input: always visible */}
        <form onSubmit={handleTextSubmit} className="flex flex-col gap-2">
          <label htmlFor={inputId} className="sr-only">
            {t('input_placeholder')}
          </label>
          <textarea
            id={inputId}
            ref={inputRef}
            value={voiceState === 'listening' ? interimTranscript : textInput}
            onChange={(e) => {
              if (voiceState !== 'listening' && voiceState !== 'processing') setTextInput(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              voiceState === 'listening'
                ? t('listening')
                : voiceState === 'processing' && voiceActive
                  ? t('voice_processing_input')
                  : t('input_placeholder')
            }
            rows={3}
            readOnly={voiceState === 'listening' || (voiceState === 'processing' && voiceActive)}
            disabled={aiThinking || scorecardLoading}
            className={[
              'w-full text-body bg-canvas border-[1.5px] rounded-lg px-4 py-3 resize-none',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
              'disabled:opacity-50',
              voiceState === 'listening'
                ? 'text-ink-soft border-accent/60 italic cursor-default placeholder:not-italic placeholder:text-accent-deep/60'
                : voiceState === 'processing' && voiceActive
                  ? 'text-ink-soft border-accent/30 cursor-default placeholder:text-ink-muted'
                  : 'text-ink border-border placeholder:text-ink-muted',
            ].join(' ')}
            aria-label={t('input_placeholder')}
            aria-live={voiceState === 'listening' ? 'polite' : undefined}
          />

          {/* Real-time voice transcription status — appears directly below the textarea */}
          {voiceActive && (voiceState === 'listening' || voiceState === 'processing') && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 px-1 -mt-1"
            >
              {voiceState === 'listening' ? (
                <>
                  <VoicePulse />
                  <span className="text-caption text-accent-deep">
                    {interimTranscript.trim() ? t('voice_transcribing') : t('voice_speak_now')}
                  </span>
                </>
              ) : (
                <>
                  <ThinkingDots />
                  <span className="text-caption text-ink-soft">{t('voice_processing_input')}</span>
                </>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            {/* Voice toggle (if supported and not yet decided) */}
            {voiceSupported && micState === 'granted' && !voiceActive && (
              <button
                type="button"
                onClick={toggleVoice}
                className="text-caption text-accent-deep underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm"
              >
                {t('voice_mode')}
              </button>
            )}
            {(!voiceSupported || micState !== 'granted' || voiceActive) && (
              <span aria-hidden="true" />
            )}

            <div className="flex gap-3">
              {hasMinTurns && (
                <Button
                  label={scorecardLoading ? t('getting_scorecard') : t('get_scorecard')}
                  loading={scorecardLoading}
                  variant="secondary"
                  onClick={handleEndSession}
                  disabled={aiThinking || scorecardLoading}
                />
              )}
              <Button
                label={aiThinking ? t('sending') : t('send')}
                loading={aiThinking && textInput.trim().length === 0}
                type="submit"
                disabled={!textInput.trim() || aiThinking || scorecardLoading}
              />
            </div>
          </div>

          {scorecardError && (
            <p role="alert" className="text-caption text-error mt-1">
              {scorecardError}
            </p>
          )}
        </form>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Stage: scorecard
  // ---------------------------------------------------------------------------

  if (stage === 'scorecard' && scorecardData) {
    return (
      <div ref={scorecardRef} tabIndex={-1}>
        <Scorecard
          scorecard={scorecardData}
          onTryAgain={handleTryAgain}
          onChooseDifferent={handleReset}
        />
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ScenarioCardProps {
  scenarioKey: ScenarioKey
  title: string
  description: string
  onSelect: () => void
}

function ScenarioCard({ title, description, onSelect }: ScenarioCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-lg border-[1.5px] border-border bg-surface hover:border-accent-deep hover:bg-canvas px-5 py-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep group"
    >
      <p className="text-body font-bold text-ink group-hover:text-ink mb-1">{title}</p>
      <p className="text-caption text-ink-soft">{description}</p>
      <span
        className="mt-3 inline-block text-caption font-bold text-accent-deep after:content-['_\2192'] group-hover:after:translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  )
}

interface TurnBubbleProps {
  role: 'user' | 'ai'
  content: string
  youLabel: string
  aiLabel: string
}

function TurnBubble({ role, content, youLabel, aiLabel }: TurnBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      className={`flex gap-2 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <span
        className="text-caption font-bold text-ink-muted shrink-0 pt-0.5 min-w-[32px] text-center"
        aria-hidden="true"
      >
        {isUser ? youLabel.slice(0, 3) : 'AI'}
      </span>
      <div
        className={[
          'rounded-lg px-4 py-3 text-body max-w-[85%]',
          isUser
            ? 'bg-ink text-ink-inverse ml-auto'
            : 'bg-canvas border border-border text-ink',
        ].join(' ')}
      >
        <p className="sr-only">{isUser ? youLabel : aiLabel}:</p>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}

interface MicPromptProps {
  title: string
  body: string
  grantLabel: string
  denyLabel: string
  onGrant: () => void
  onDeny: () => void
}

function MicPrompt({ title, body, grantLabel, denyLabel, onGrant, onDeny }: MicPromptProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className="rounded-lg border border-accent-deep/30 bg-accent/10 px-5 py-4 space-y-3"
    >
      <div>
        <p className="text-body font-bold text-ink">{title}</p>
        <p className="text-caption text-ink-soft mt-1">{body}</p>
      </div>
      <div className="flex gap-3">
        <Button
          label={grantLabel}
          onClick={onGrant}
          className="py-2 px-4 text-caption"
        />
        <Button
          label={denyLabel}
          variant="ghost"
          onClick={onDeny}
          className="py-2 px-4 text-caption"
        />
      </div>
    </div>
  )
}

interface PastSessionRowProps {
  session: {
    _id: Id<'rehearsalSessions'>
    scenarioKey: string
    status: string
    turnCount: number
    startedAt: number
    completedAt?: number
  }
  t: ReturnType<typeof useTranslations<'rehearsal'>>
  locale: string
  onContinue?: (sessionId: Id<'rehearsalSessions'>, scenarioKey: string) => void
}

function PastSessionRow({ session, t, locale, onContinue }: PastSessionRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteSessionMutation = useMutation(api.rehearsal.deleteSession)

  const date = new Date(session.startedAt).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })

  const titleKey = (SCENARIO_TITLE_KEYS as Record<string, string | undefined>)[session.scenarioKey]
  const isInProgress = session.status === 'in_progress'
  const canContinue = isInProgress && onContinue

  async function handleDeleteConfirm() {
    setIsDeleting(true)
    try {
      await deleteSessionMutation({ sessionId: session._id })
      // Row disappears reactively via the listSessions query
    } catch {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      {/* Title + meta */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-body font-semibold text-ink truncate">
          {titleKey ? t(titleKey) : formatScenarioKey(session.scenarioKey)}
        </span>
        <span className="text-caption text-ink-soft">
          {date} &middot; {t('turns_count', { count: session.turnCount })}
        </span>
      </div>

      {/* Right side: actions or inline delete confirmation */}
      <div className="flex items-center gap-2 shrink-0">
        {confirmDelete ? (
          <>
            <span className="text-caption text-ink-soft hidden sm:inline">
              {t('delete_session_confirm')}
            </span>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
              className="text-caption text-ink-soft underline underline-offset-2 hover:text-ink disabled:opacity-50"
            >
              {t('delete_session_cancel')}
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="text-caption font-semibold text-error underline underline-offset-2 hover:opacity-75 disabled:opacity-50"
            >
              {isDeleting ? t('delete_session_deleting') : t('delete_session_confirm_action')}
            </button>
          </>
        ) : (
          <>
            {canContinue && (
              <button
                type="button"
                onClick={() => onContinue(session._id, session.scenarioKey)}
                className="text-caption font-bold text-accent-deep hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm"
              >
                {t('continue')}
              </button>
            )}
            <span className="flex items-center gap-1.5">
              <span
                className={[
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  session.status === 'completed'
                    ? 'bg-ink-soft'
                    : 'bg-accent-deep',
                ].join(' ')}
                aria-hidden="true"
              />
              <span
                className={[
                  'text-caption',
                  session.status === 'completed'
                    ? 'text-ink-soft'
                    : 'text-accent-deep',
                ].join(' ')}
              >
                {session.status === 'completed' ? t('session_completed') : t('session_in_progress')}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label={t('delete_session')}
              className="p-1 -mr-1 rounded text-ink-muted hover:text-error hover:bg-error/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ThinkingDots() {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-ink-muted animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
        />
      ))}
    </span>
  )
}

function VoicePulse() {
  return (
    <span className="relative flex w-3 h-3" aria-hidden="true">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-deep opacity-75" />
      <span className="relative inline-flex rounded-full w-3 h-3 bg-accent-deep" />
    </span>
  )
}
