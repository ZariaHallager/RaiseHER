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
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult | undefined
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative | undefined
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
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

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

  useEffect(() => {
    if (!voiceActive || !lastAITurnContent) return
    if (lastAITurnContent === spokenRef.current) return
    spokenRef.current = lastAITurnContent

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(lastAITurnContent)
      const bcp47 = LOCALE_TO_BCP47[locale]
      const voices = window.speechSynthesis.getVoices()
      const match = voices.find((v) => v.lang.startsWith(bcp47.split('-')[0]))
      if (match) utter.voice = match
      utter.lang = bcp47
      utter.onend = () => {
        if (voiceActive && !aiThinking) {
          startListening()
        }
      }
      window.speechSynthesis.speak(utter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAITurnContent, voiceActive])

  // ── Voice permission flow ─────────────────────────────────────────────────

  async function requestMicPermission() {
    setMicState('prompted')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setMicState('granted')
      setVoiceActive(true)
      startListening()
    } catch {
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
    if (!SR) return

    recognitionRef.current?.abort()

    const rec = new SR()
    rec.lang = LOCALE_TO_BCP47[locale]
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart = () => setVoiceState('listening')
    rec.onend = () => {
      setVoiceState('idle')
    }
    rec.onerror = () => {
      setVoiceState('idle')
    }
    rec.onresult = (event: SpeechRecognitionResultEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      if (transcript.trim()) {
        setVoiceState('processing')
        submitUserTurn(transcript, 'voice')
      }
    }

    recognitionRef.current = rec
    rec.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  function stopListening() {
    recognitionRef.current?.stop()
    setVoiceState('idle')
  }

  function toggleVoice() {
    if (voiceActive) {
      stopListening()
      window.speechSynthesis?.cancel()
      setVoiceActive(false)
      setVoiceState('idle')
    } else if (micState === 'granted') {
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
                  <PastSessionRow session={session} t={t} locale={locale} />
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
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('input_placeholder')}
            rows={3}
            disabled={aiThinking || scorecardLoading}
            className="w-full text-body bg-canvas text-ink border-[1.5px] border-border rounded-lg px-4 py-3 placeholder:text-ink-muted resize-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep disabled:opacity-50"
            aria-label={t('input_placeholder')}
          />
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
}

function PastSessionRow({ session, t, locale }: PastSessionRowProps) {
  const date = new Date(session.startedAt).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })

  const titleKey = (SCENARIO_TITLE_KEYS as Record<string, string | undefined>)[session.scenarioKey]

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-caption">
      <div className="flex flex-col gap-0.5">
        <span className="text-body font-semibold text-ink">
          {titleKey ? t(titleKey) : session.scenarioKey}
        </span>
        <span className="text-caption text-ink-soft">
          {date} &middot; {session.turnCount} {session.turnCount === 1 ? 'turn' : 'turns'}
        </span>
      </div>
      <span
        className={[
          'text-caption font-bold px-2 py-1 rounded-sm',
          session.status === 'completed'
            ? 'bg-ink text-ink-inverse'
            : 'bg-border text-ink-soft',
        ].join(' ')}
      >
        {session.status === 'completed' ? t('session_completed') : t('session_in_progress')}
      </span>
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
