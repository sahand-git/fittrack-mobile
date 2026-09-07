# Premium Nutrition, Workout, and Visual Refresh Design

**Date:** 2026-09-07
**Status:** Approved by user

## Goal

Make FitTrack feel calm, polished, and ready for premium features while adding professional manual vitamin and mineral tracking and fixing the workout form on narrow phones.

## Product structure

### Nutrition

The dashboard wellness card becomes a clear entry point named **Nutrition**. Its detail view contains:

- **Vitamins** tab for vitamin totals and manual entries.
- **Minerals** tab for mineral totals and manual entries.
- **Supplements** section below the tabs for logging products the user takes.

Reminder controls do not appear in this view. Meal, water, and supplement scheduling moves to **Settings > Notifications & Schedule**. A dashboard bell shortcut opens that settings area directly.

### Daily nutrient totals

Each nutrient card shows three values where data exists:

- food intake calculated from logged meals;
- manual or supplement intake entered by the user;
- daily combined total.

The app will not invent missing food nutrient values or recommend a dose. Empty values are shown as not logged instead of zero when the source data is unknown.

### Manual entry flow

An **Add intake** button opens a compact phone-safe sheet. The user selects a vitamin or mineral, enters an amount in that nutrient's canonical unit, chooses the time, and can add an optional source name and note. Examples of source names are “multivitamin” or “doctor-prescribed iron.”

The chosen nutrient controls the unit so users cannot accidentally combine mg and mcg. Saved entries appear in a chronological daily list with edit and delete actions. The action confirms destructive deletion and keeps past days available through the existing date navigation.

Supported initial nutrients are calcium, iron, magnesium, potassium, zinc, vitamin C, vitamin D, and vitamin B12. The model remains extensible so more nutrients can be added later without changing existing records.

### Supplements

Supplements remain separate from vitamin and mineral tabs because one supplement may contain several nutrients. A supplement record contains a name, optional serving description, time, and optional nutrient components. Marking it taken records its nutrient components in that day's manual total and preserves the existing reminder completion behavior.

## Notifications and schedule

The existing reminder editor moves intact to **Settings > Notifications & Schedule** and keeps user-chosen meal, water, and supplement times. The settings screen explains that phone notification permission is required. Skipping reminders disables scheduling without deleting saved supplement definitions.

## Workout form

The duration field stores an editable text draft. Clearing the field leaves it blank while the user types. Validation runs on save: a valid whole number from 1 to 360 minutes is required.

Quick duration chips provide 15, 30, 45, and 60 minute choices. Selecting a chip fills the field, while typing another value remains supported.

The form uses a consistent two-column field grid only when the screen is wide enough. On narrow phones, fields stack with labels above them. Every label uses the same reserved height and baseline. “Calculated” becomes a small status badge outside the calories label so it cannot push the label out of alignment.

Buttons and category controls keep complete words together. Long text wraps between words, never in the middle of a word. Long translated controls use horizontal scrolling or a compact layout when necessary.

## Visual direction: Midnight Sage

The refresh uses a deep navy background, quiet blue-gray surfaces, and muted sage/teal as the main accent. Amber is reserved for reminders or attention states, and coral is reserved for destructive actions and errors.

Cards use softer borders, less glow, more whitespace, and one clear emphasis level. Buttons use consistent heights and corner radii. Forms use larger touch targets and calm focus rings. Typography uses a tighter hierarchy: page title, section title, field label, and supporting text.

The design remains fully responsive for small Android and iPhone screens and respects left-to-right English plus right-to-left Arabic and Kurdish Sorani. Decorative gradients stay subtle and do not reduce contrast.

## Data and compatibility

Each daily log gains an optional list of nutrient intake entries. Each entry contains an ID, nutrient key, amount, canonical unit, source type, optional source name, optional note, and timestamp.

All new fields are optional so existing on-device data and older JSON exports still load. JSON export/import includes the new entries. Cloud backup remains disabled as requested; no Firestore permissions are changed.

## Validation and errors

- Nutrient amounts must be finite positive numbers.
- Workout duration must be a whole number from 1 to 360.
- Invalid fields show a short message next to the field and retain what the user typed.
- Saving is blocked until required values are valid.
- Manual entries can be edited without creating duplicates.
- Unknown or older nutrient records remain preserved during import even when the UI cannot yet summarize them.

## Accessibility and localization

All controls have accessible names, visible focus states, and at least 44px touch targets. Tabs expose selected state to assistive technology. Dialogs trap focus and provide a visible close button.

Every new label, validation message, and status is translated to Arabic and Kurdish Sorani. RTL layouts reverse alignment and action flow while keeping numbers and units readable.

## Verification

Tests will cover duration draft parsing, nutrient validation and totals, add/edit/delete behavior, supplement completion totals, backward-compatible JSON import/export, and reminder behavior after relocation. Type checking and the production build must pass. Narrow mobile widths and RTL layouts will be inspected for overflow and broken words before release.
