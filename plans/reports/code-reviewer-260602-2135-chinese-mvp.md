# Code Review — Chinese Learning MVP

Date: 2026-06-02
Scope: src/ focus areas (speech, drill-engine, srs-lite, review flow, mcq card, stroke viewer, progress context, lesson JSON x6)
Build: PASSES. Judged against KISS/YAGNI/DRY for 1-2 personal users.

## Overall
Clean, well-modularized, idiomatic React+TS. Comments in Vietnamese are helpful. Tone-mark/meaning data is accurate across all 6 lessons (spot-check found zero tone-number or meaning errors). One real correctness bug (listen mode dead-ends without a zh TTS voice). Rest is minor.

---

## Critical

### 1. Listen mode is unanswerable when device has no Chinese TTS voice
`mcq-question-card.tsx:46-50` + `:22`
- Listen questions render ONLY an `AudioButton` (no hanzi shown). `AudioButton` is `disabled` when `!isSupported` (`audio-button.tsx:17`), and the auto-speak at `mcq-question-card.tsx:22` is also gated on `isSupported`.
- Result: on a device without a zh-CN voice, a listen question shows no audio (button disabled) AND no readable prompt → impossible to answer. The mode-select screen (`review-page.tsx:20`) offers "Nghe chọn chữ" unconditionally.
- Fix options (pick one):
  - In `review-page.tsx`, hide/disable the "listen" and "mixed" mode cards when `useSpeech().isSupported` is false (cleanest UX).
  - OR in `mcq-question-card.tsx`, when `speakPrompt && !isSupported`, also render the hanzi prompt (or pinyin) as a visible fallback so the question stays answerable.
- Note: same latent gap in `mixed` mode, since it can emit listen questions.

---

## Important

### 2. Auto-speak can fire before voices finish loading
`use-speech.ts:18-28`, `mcq-question-card.tsx:20-24`
- `isSupported` requires `ready && zhVoice !== null`. `voiceschanged` updates the hook, but the `useEffect` in the card depends on `[question]` only, not `isSupported`. The first listen question can mount while `isSupported` is still false (voices async), so auto-speak is skipped and never retried — user must press "Nghe lại".
- Fix: add `isSupported` to the effect deps (and guard against double-speak), or trigger speak in a small effect keyed on `[question, isSupported]` that only speaks once per question.

### 3. `retryWrong` regenerates questions instead of replaying the wrong ones
`review-page.tsx:74-77` → `start(mode, wrong)` → `generateMcqSession(...)`
- "Ôn lại từ sai" builds a brand-new session from the wrong vocab: new distractors, new shuffle, and in `mixed` mode a word missed on a *tone* question may reappear as a *meaning* question. Functionally okay for self-study, but it doesn't re-test the same skill the user failed.
- If intentional, fine (KISS). If you want true retry, persist the original `McqQuestion[]` and filter, rather than regenerating.

---

## Minor

### 4. Distractor pool can underfill (not triggered by current data)
`drill-engine.ts:28-36`, `:44`/`:58`
- `pickDistractors` returns up to 3 unique-by-field items; if a lesson had <4 distinct `vi`/`hanzi` values, an MCQ would render <4 options. All current lessons have ≥13 items, so no live issue. Leave as-is for MVP; just be aware if very short lessons get added.

### 5. `vocabKey` keyed on hanzi only — duplicate hanzi within one lesson would collide
`content-index.ts:26-28`
- Progress key is `${lessonId}:${hanzi}`. Two identical hanzi in the same lesson would share status. None exist today (checked all 6 lessons; cross-lesson dupes like 八/一/月/你 are fine since keys are lesson-scoped). No action needed for MVP.

### 6. `mcq-question-card` option `key={i}`
`mcq-question-card.tsx:56`
- Index keys are acceptable here because options are static per question and the card is remounted via `key={index}` in the parent. No bug; noting for completeness.

### 7. Stroke viewer `animateAll` timers not cleared
`stroke-order-viewer.tsx:50-54`
- `setTimeout`s aren't tracked/cleared; if `hanzi` changes mid-animation the writers are recreated but pending timeouts call `animateCharacter()` on discarded writers (caught internally by hanzi-writer, harmless). Cleanup at `:44-47` handles DOM. Low impact; could store timer ids and clear in the effect cleanup if you want tidiness.

---

## Nice-to-have

### 8. `useSpeech` instantiated per component
Each `AudioButton`/`McqQuestionCard` runs its own `useSpeech` (own voices listener). Cheap at this scale; a single context/provider would be marginally cleaner (DRY) but YAGNI for 1-2 users.

### 9. `hasSynth` returned but unused
`use-speech.ts:46` — dead surface; remove or use for a finer fallback message.

### 10. `toneQuestion` uses fixed 5 options every time
`drill-engine.ts:74` — always lists all 5 tone labels. Correct and clear; just note answer position is the only thing shuffled-by-construction (via TONE_OPTIONS order, which is fixed). Consider shuffling label order so the correct slot isn't positionally predictable across questions. Very minor.

---

## Data accuracy (lesson JSON) — PASS
Verified tone numbers vs pinyin diacritics and Vietnamese meanings:
- L00: ma/ba/yi sets — all tone marks match `tones`. ✓
- L01: `bú kèqi [2,4,0]`, `duìbuqǐ [4,0,3]`, `méi guānxi [2,1,0]` — tone sandhi reflected correctly in both pinyin and tones. ✓
- L02: numbers 0-10 + measure words — all match. ✓
- L03: `女儿 nǚ'ér [3,2]`, neutral-tone family terms — all match. ✓
- L04: time/date terms incl. `星期几 [1,1,3]` — match. ✓
- L05: verbs/objects incl. `水果 shuǐguǒ [3,3]`, `苹果 píngguǒ [2,3]` — match. ✓
No wrong tone numbers or mismatched meanings found.

---

## Positive
- `progress-store` load/save wrapped in try/catch with safe defaults (private mode / quota) — solid.
- First-mount write guard in `progress-context.tsx:34-40` correctly avoids clobbering on initial load.
- `srs-lite` transitions are simple and correct for the model.
- `drill-engine` distractor de-dup via `Set` is clean; Fisher-Yates shuffle is correct.
- Stroke viewer filters non-CJK and rebuilds on `hanzi` change with proper DOM cleanup.

---

## Recommended actions (priority order)
1. Fix listen-mode dead-end (finding #1) — gate listen/mixed modes on `isSupported`, or add a visible prompt fallback.
2. Add `isSupported` to the auto-speak effect deps (finding #2).
3. Decide if `retryWrong` regeneration is intended (finding #3); document or change.
4. Optional tidy-ups: #7 timer cleanup, #9 remove `hasSynth`, #10 shuffle tone labels.

## Unresolved questions
- Is listen/mixed mode expected to be usable on devices without a zh voice, or is gating them off acceptable for your devices? (Determines fix for #1.)
- Is `retryWrong` meant to re-test the exact failed questions, or just the failed words in any mode? (Determines #3.)
