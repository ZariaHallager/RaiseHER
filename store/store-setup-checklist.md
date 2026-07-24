# Store Setup Checklist

Operational steps required before TestFlight + Play Internal Testing builds can be submitted.
Items marked **[CODE DONE]** are handled in the codebase. Items marked **[MANUAL]** require team action.

---

## App Store Connect (iOS / TestFlight)

### App Registration
- [MANUAL] Create app record in App Store Connect with bundle ID `com.raiseher.app`
- [MANUAL] Set app name: "RaiseHER"
- [MANUAL] Set primary language: English (U.S.)
- [CODE DONE] Bundle identifier: `com.raiseher.app` (set in `app.json`)
- [MANUAL] Set SKU: `com.raiseher.app`
- [MANUAL] Set primary category: Productivity
- [MANUAL] Set secondary category: Finance

### Age Rating
- [MANUAL] Complete age rating questionnaire in App Store Connect
- All content questions: NONE (no violence, mature themes, gambling, etc.)
- Unrestricted web access: No
- Kids age band: None
- Expected result: **4+**
- See `store.config.json` `advisory` section for full answers (or run `eas metadata:push` after setup)

### Privacy Nutrition Label
- [MANUAL] Complete App Privacy section — see `store/ios-privacy-nutrition-label.md`
- [MANUAL] Publish privacy policy at `https://raiseher.app/privacy` before TestFlight external review

### Store Listing (EAS Metadata)
- [CODE DONE] Localized listings configured in `store.config.json` for en-US, es-MX, fr-FR, pt-BR
- [MANUAL] Fill in review contact info in `store.config.json` (search for `FILL_IN_`)
- [MANUAL] Run `eas metadata:push` after App Store Connect app record is created

### Screenshots
- [MANUAL] Capture screenshots for required device sizes:
  - iPhone 6.9" (1320 x 2868 or 1290 x 2796): 3 minimum
  - iPhone 6.5" (1284 x 2778): 3 minimum
  - iPad Pro 12.9" (if tablet support added later)
- Screens to capture: Onboarding, Today tab, Pay Gap result, Wins Ledger, Rehearsal
- No em dashes in screenshot captions; no hype language

### App Icon
- [CODE DONE] Icon at `./assets/icon.png` — verify 1024x1024px, no alpha channel
- [MANUAL] Upload 1024x1024 icon to App Store Connect (separate from app bundle)

### EAS Submit Configuration
- [MANUAL] Fill in `eas.json` submit > production > ios fields:
  - `appleId`: your Apple ID email
  - `ascAppId`: numeric App Store Connect app ID
  - `appleTeamId`: 10-character Apple Developer Team ID
- Run: `eas build --profile production --platform ios`
- Then: `eas submit --profile production --platform ios`

---

## Google Play Console (Android / Play Internal Testing)

### App Registration
- [MANUAL] Create app in Google Play Console with package `com.raiseher.app`
- [MANUAL] Set app name: "RaiseHER"
- [MANUAL] Set default language: English (United States)
- [CODE DONE] Package name: `com.raiseher.app` (set in `app.json`)

### Content Rating (IARC)
- [MANUAL] Complete IARC content rating questionnaire in Google Play Console
- Expected rating: **Everyone** (no mature content)
- The app contains: career/finance content, AI-generated text, microphone access

### Data Safety
- [MANUAL] Complete Data Safety form — see `store/google-play-data-safety.md`

### Store Listing (Manual — EAS Metadata does not support Google Play)
Add the following text for each language in Play Console > Store listing > Translations:

**Short description (80 chars max)**
- en: Know your worth. Close the pay gap. AI-powered career tools for women.
- es: Conoce tu valor. Cierra la brecha salarial. Herramientas de carrera con IA.
- fr: Connaissez votre valeur. Fermez l'écart salarial. Outils carrière IA.
- pt: Conheça seu valor. Feche a disparidade salarial. Ferramentas de carreira IA.

**Full description (4000 chars max)**
Use the corresponding `description` field from `store.config.json` for each locale.

### App Icon
- [CODE DONE] Adaptive icon configured: foreground `./assets/adaptive-icon.png`, background `#F5F0EB`
- [MANUAL] Upload 512x512 hi-res icon to Play Console

### Screenshots
- [MANUAL] Capture for phone (16:9 or 9:16), minimum 2 per locale
- Same screens as iOS

### Microphone Permission Rationale
- [CODE DONE] `RECORD_AUDIO` permission declared in `app.json`
- [MANUAL] Add permission rationale in Play Console (App content > App permissions):
  "RaiseHER uses the microphone only during salary negotiation rehearsal sessions. The microphone is never accessed during onboarding or background operation."

### EAS Submit Configuration
- [MANUAL] Create Google Play service account and download JSON key
- [MANUAL] Fill in `eas.json` submit > production > android `serviceAccountKeyPath`
- Run: `eas build --profile production --platform android`
- Then: `eas submit --profile production --platform android`

---

## EAS Account Setup (One-time)

- [MANUAL] Run `npm install -g eas-cli` (or `npx eas-cli`)
- [MANUAL] Run `eas login` with your Expo account
- [MANUAL] Run `eas build:configure` to create EAS project and link `eas.json`
  - This will add `"extra": { "eas": { "projectId": "..." } }` to `app.json`
- [MANUAL] Set required secrets in EAS dashboard or `.env`:
  - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CONVEX_URL`
  - Any other env vars from `src/lib/` or `convex/`

---

## Build Commands Reference

```bash
# Development build (internal device testing)
eas build --profile development --platform all

# Preview build (internal stakeholder testing)
eas build --profile preview --platform all

# Production build (TestFlight + Play Internal Testing)
eas build --profile production --platform ios
eas build --profile production --platform android

# Submit to stores
eas submit --profile production --platform ios
eas submit --profile production --platform android

# Push App Store metadata (after App Store Connect app record exists)
eas metadata:push
```
