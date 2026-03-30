# Multilingual and Voice Controls

This document explains language support and voice actions in NeuroRecover.

## Supported UI languages

- English (`en`)
- French (`fr`)
- Spanish (`es`)
- Portuguese (`pt`)
- Swahili (`sw`)
- Hausa (`ha`)
- Yoruba (`yo`)
- Nigerian Pidgin (`pcm-NG`)

You can change language from:

- Header language selector (inside app)
- `Settings` -> `App language`

## Voice actions

Voice recognition can be toggled from:

- Header `Voice` button
- `Settings` -> `Voice commands`

Supported command intents include:

- Open pages:
  - `open piano`
  - `open bubbles`
  - `open progress`
  - `open settings`
  - `open clinical`
  - `open admin`
  - `open dashboard`
- Session controls:
  - `start session`
  - `pause session`
  - `end session`

Some language-friendly variants are included (French, Spanish/Portuguese, Swahili, Hausa, Yoruba, and Nigerian Pidgin patterns).

## Speech locale behavior

- Speech recognition and speech synthesis use BCP 47 language tags.
- The app maps selected UI language to a speech locale.
- For Nigerian Pidgin (`pcm-NG`), speech engine fallback uses `en-NG` where needed.

## Browser support notes

- Speech recognition is browser-dependent and may be unavailable in some environments.
- Speech synthesis generally has wider browser support than recognition.
- If unavailable, app functionality remains fully usable via touch/click.

## Standards and references used

- MDN SpeechRecognition `lang`:
  - https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang
- MDN SpeechSynthesisUtterance `lang`:
  - https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/lang
- IETF BCP 47 language tags:
  - http://www.rfc-editor.org/rfc/bcp/bcp47.txt

## Implementation files

- `web-app/src/utils/i18n.ts`
- `web-app/src/hooks/useVoiceActions.ts`
- `web-app/src/utils/voiceCoach.ts`
- `web-app/src/layout/AppShell.tsx`
- `web-app/src/pages/Settings.tsx`
- `web-app/src/components/SessionWrapper.tsx`
