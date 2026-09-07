# Premium Nutrition, Workout, and Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editable vitamin, mineral, and supplement intake tracking, relocate reminder settings, repair workout duration editing and layout, and apply the approved Midnight Sage responsive design.

**Architecture:** Keep daily nutrient intake in optional `DayLog.nutrientIntakes` records and derive food, manual, supplement, and combined totals through pure utilities. Split the existing wellness component into focused nutrition, intake-entry, and notification-settings components, while retaining local notification scheduling and backward-compatible JSON backups. Use shared CSS component classes for the visual refresh and pure input parsers for testable form behavior.

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS 4, Capacitor 8, Node test runner, Vite 6.

**Spec:** `docs/superpowers/specs/2026-09-07-premium-nutrition-workout-redesign-design.md`

## Global Constraints

- Cloud backup remains disabled; do not change Firestore rules or enable cloud writes.
- Existing local data and version 2.0 JSON backups must remain readable.
- Support English, Arabic, and Kurdish Sorani, including RTL layout.
- Nutrient amounts are user-entered records; the app must not recommend doses.
- Dialog controls must remain visible on narrow screens and respect safe areas.
- Controls need visible focus states, accessible names, and at least 44px touch targets.

---

### Task 1: Nutrient intake domain and calculations

**Files:**
- Modify: `src/types.ts`
- Modify: `src/utils/micronutrients.ts`
- Test: `tests/micronutrients.test.ts`

**Interfaces:**
- Consumes: existing `Micronutrients`, `MICRONUTRIENT_KEYS`, and `sumMicronutrients(items)`.
- Produces: `NutrientIntakeEntry`, `NUTRIENT_META`, `parseNutrientAmount(value)`, `sumNutrientEntries(entries)`, and `combineNutrientTotals(food, manual, supplements)`.

- [ ] **Step 1: Write failing domain tests**

Add tests proving positive decimal parsing, rejection of blank/zero/negative/non-finite input, correct canonical units and groups, source totals, and combined totals:

```ts
test('validates manual nutrient amounts without replacing an empty draft', () => {
  assert.equal(parseNutrientAmount('12.5'), 12.5);
  for (const value of ['', '0', '-2', 'word', 'Infinity']) assert.equal(parseNutrientAmount(value), null);
});

test('separates food, manual, and supplement nutrient totals', () => {
  const manual = sumNutrientEntries([
    { id: 'a', nutrient: 'vitaminDmcg', amount: 10, unit: 'mcg', sourceType: 'manual', loggedAt: '2026-09-07T09:00:00.000Z' },
    { id: 'b', nutrient: 'ironMg', amount: 5, unit: 'mg', sourceType: 'supplement', sourceName: 'Iron tablet', loggedAt: '2026-09-07T10:00:00.000Z' }
  ]);
  const total = combineNutrientTotals({ ironMg: { value: 3, coverage: 1 } }, manual, {});
  assert.deepEqual(total.ironMg, { food: 3, manual: 0, supplement: 5, total: 8, coverage: 1 });
  assert.equal(NUTRIENT_META.vitaminDmcg.group, 'vitamin');
  assert.equal(NUTRIENT_META.vitaminDmcg.unit, 'mcg');
});
```

- [ ] **Step 2: Run the micronutrient test and verify failure**

Run: `npm test -- --test-name-pattern="nutrient"`

Expected: FAIL because the new exports and type do not exist.

- [ ] **Step 3: Add the types and pure utilities**

Add to `src/types.ts`:

```ts
export type NutrientSourceType = 'manual' | 'supplement';
export interface NutrientIntakeEntry {
  id: string;
  nutrient: keyof Micronutrients;
  amount: number;
  unit: 'mg' | 'mcg';
  sourceType: NutrientSourceType;
  sourceName?: string;
  note?: string;
  loggedAt: string;
}
```

Extend `SupplementReminder` with `nutrients?: Micronutrients` and `DayLog` with `nutrientIntakes?: NutrientIntakeEntry[]`.

In `src/utils/micronutrients.ts`, define metadata for all eight supported keys and implement:

```ts
export function parseNutrientAmount(value: string): number | null {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}

export function sumNutrientEntries(entries: NutrientIntakeEntry[]): Record<MicronutrientKey, { manual: number; supplement: number }> {
  const result = Object.fromEntries(MICRONUTRIENT_KEYS.map(key => [key, { manual: 0, supplement: 0 }])) as Record<MicronutrientKey, { manual: number; supplement: number }>;
  for (const entry of entries) result[entry.nutrient][entry.sourceType] = Math.round((result[entry.nutrient][entry.sourceType] + entry.amount) * 100) / 100;
  return result;
}
```

Implement `combineNutrientTotals` so each nutrient exposes `{ food, manual, supplement, total, coverage }`, retaining undefined food coverage instead of treating unknown label data as known zero.

- [ ] **Step 4: Run the focused and full tests**

Run: `npm test -- --test-name-pattern="nutrient"`

Expected: PASS.

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 5: Commit the domain change**

```bash
git add src/types.ts src/utils/micronutrients.ts tests/micronutrients.test.ts
git commit -m "feat: add daily nutrient intake model"
```

### Task 2: Persistence, editing, and backup compatibility

**Files:**
- Modify: `src/context/FitnessContext.tsx`
- Modify: `src/utils/cloudBackupCore.ts`
- Test: `tests/cloudBackup.test.ts`

**Interfaces:**
- Consumes: `NutrientIntakeEntry` from Task 1.
- Produces: context methods `addNutrientIntake(input)`, `updateNutrientIntake(id, input)`, and `removeNutrientIntake(id)`.

- [ ] **Step 1: Add failing backup tests**

Extend the existing valid backup fixture with a nutrient entry and assert that parsing preserves it. Add a second test that removes `nutrientIntakes` from the day and proves the older backup still parses.

```ts
value.dailyLogs['2026-09-03'].nutrientIntakes = [{
  id: 'nutrient_1', nutrient: 'vitaminCmg', amount: 75, unit: 'mg',
  sourceType: 'manual', sourceName: 'Vitamin C', note: 'With breakfast',
  loggedAt: '2026-09-03T08:00:00.000Z'
}];
assert.equal(parseBackup(JSON.stringify(value)).dailyLogs['2026-09-03'].nutrientIntakes?.[0].amount, 75);
```

- [ ] **Step 2: Run backup tests and verify failure**

Run: `node --test tests/cloudBackup.test.ts`

Expected: FAIL because the allowlist drops `nutrientIntakes`.

- [ ] **Step 3: Extend the strict backup allowlist**

Create validators for nutrient key, unit, source type, and entry shape. Add `nutrientIntakes: optional(list(nutrientIntake))` to the day validator and `nutrients: optional(shape(...micronutrient fields...))` to supplement reminders. Retain version `'2.0'` so old exports remain compatible.

- [ ] **Step 4: Add context mutations**

Expose these signatures from the context:

```ts
addNutrientIntake(input: Omit<NutrientIntakeEntry, 'id'>): void;
updateNutrientIntake(id: string, input: Omit<NutrientIntakeEntry, 'id'>): void;
removeNutrientIntake(id: string): void;
```

Each method updates only `dailyLogs[currentDate]`; add prepends a generated `nutrient_...` ID, update replaces exactly one matching entry, and remove filters exactly one ID. Do not mutate earlier state arrays.

- [ ] **Step 5: Run backup tests, type check, and full tests**

Run: `node --test tests/cloudBackup.test.ts && npm run lint && npm test`

Expected: all commands pass.

- [ ] **Step 6: Commit persistence changes**

```bash
git add src/context/FitnessContext.tsx src/utils/cloudBackupCore.ts tests/cloudBackup.test.ts
git commit -m "feat: persist editable nutrient intake"
```

### Task 3: Professional Nutrition screen and intake editor

**Files:**
- Create: `src/components/NutrientIntakeModal.tsx`
- Modify: `src/components/WellnessPanel.tsx`
- Modify: `src/locales/ar.json`
- Modify: `src/locales/ckb.json`

**Interfaces:**
- Consumes: Task 1 nutrient metadata/totals and Task 2 context mutations.
- Produces: `NutrientIntakeModal` with `entry`, `initialGroup`, `onSave`, and `onClose`; a dashboard Nutrition card with Vitamins and Minerals tabs plus Supplements section.

- [ ] **Step 1: Build the modal around validated string drafts**

Use local string state for amount and submit only after `parseNutrientAmount` succeeds. The nutrient selector is filtered by `initialGroup`; the unit is read-only from `NUTRIENT_META`. Provide source type, source name, time, note, save, and close controls. When editing, keep the original ID outside the form payload so the context update cannot duplicate it.

- [ ] **Step 2: Replace the mixed wellness card**

Refactor `WellnessPanel` to:

- title the card “Nutrition”;
- render accessible Vitamins and Minerals tabs with `role="tablist"` and `aria-selected`;
- display food, manual/supplement, and combined values for the active group;
- show Add intake, Edit, and Delete actions;
- render supplements below the tabs and keep existing Mark taken behavior;
- expose an `onOpenNotifications` callback for the dashboard bell;
- remove all reminder-editing state and notification permission calls.

- [ ] **Step 3: Add complete translations**

Translate every new visible string in Arabic and natural Kurdish Sorani, including Nutrition, Vitamins, Minerals, Add intake, Food, Added, Total, Source, Note, Edit intake, Delete intake, amount validation, and empty-state text. Keep units as `mg` and `mcg` with isolated left-to-right rendering.

- [ ] **Step 4: Type check and build**

Run: `npm run lint && npm run build`

Expected: both commands pass.

- [ ] **Step 5: Commit the Nutrition UI**

```bash
git add src/components/NutrientIntakeModal.tsx src/components/WellnessPanel.tsx src/locales/ar.json src/locales/ckb.json
git commit -m "feat: add professional nutrition intake tracker"
```

### Task 4: Move reminders to Settings and preserve scheduling

**Files:**
- Create: `src/components/NotificationSchedulePanel.tsx`
- Modify: `src/components/ProfileModal.tsx`
- Modify: `src/App.tsx`
- Modify: `src/locales/ar.json`
- Modify: `src/locales/ckb.json`
- Test: `tests/reminders.test.ts`

**Interfaces:**
- Consumes: existing `DEFAULT_REMINDERS`, `updateReminderSettings`, `enableNotifications`, and `notificationStatus`.
- Produces: `ProfileModal` prop `initialSection?: 'profile' | 'notifications'` and `NotificationSchedulePanel`.

- [ ] **Step 1: Strengthen the reminder regression test**

Add a test proving disabled reminder scheduling returns an empty plan while retaining settings data passed to the function:

```ts
test('disabled scheduling emits no phone notifications', () => {
  const disabled = { ...settings, enabled: false };
  assert.deepEqual(buildReminderPlan(disabled, {}, new Date('2026-09-06T07:00:00'), 3), []);
  assert.equal(disabled.supplements[0].name, 'Vitamin D');
});
```

- [ ] **Step 2: Run the reminder test**

Run: `node --test tests/reminders.test.ts`

Expected: PASS, establishing current scheduling behavior before moving the UI.

- [ ] **Step 3: Extract notification settings**

Move the existing reminder form from `WellnessPanel` into `NotificationSchedulePanel`. Preserve permission requests, notification-blocked messaging, meal times, water schedule, supplement definitions, and save/skip behavior. Disabling notifications must call `updateReminderSettings({ ...settings, enabled: false })` without clearing `settings.supplements`.

- [ ] **Step 4: Add Profile and Notifications tabs to settings**

Render two accessible tabs inside `ProfileModal`: Profile and Notifications & Schedule. Use `initialSection` when the modal opens, and reset the selected section when a new open action requests a different section. Keep Profile save scoped to biometrics and let the notification panel save independently.

- [ ] **Step 5: Wire the dashboard bell shortcut**

In `App.tsx`, store the requested profile-modal section. Pass `onOpenNotifications={() => { setProfileSection('notifications'); setIsProfileOpen(true); }}` to `WellnessPanel`; Navbar profile opens the same modal with `profile`. Closing returns to the current dashboard state.

- [ ] **Step 6: Translate, test, and build**

Add Arabic and Kurdish Sorani translations for Settings, Profile, Notifications & Schedule, and the moved section labels.

Run: `npm test && npm run lint && npm run build`

Expected: all commands pass.

- [ ] **Step 7: Commit the settings move**

```bash
git add src/components/NotificationSchedulePanel.tsx src/components/ProfileModal.tsx src/App.tsx src/locales/ar.json src/locales/ckb.json tests/reminders.test.ts
git commit -m "refactor: move reminders into settings"
```

### Task 5: Repair and simplify the workout form

**Files:**
- Create: `src/utils/workoutInput.ts`
- Modify: `src/components/AddWorkoutModal.tsx`
- Modify: `src/App.tsx`
- Modify: `src/locales/ar.json`
- Modify: `src/locales/ckb.json`
- Test: `tests/workoutInput.test.ts`

**Interfaces:**
- Produces: `parseWorkoutDuration(value: string): number | null`.
- Consumes: existing `estimateWorkoutCalories(met, duration, weightKg)` and `addWorkout`.

- [ ] **Step 1: Write the failing duration parser test**

```ts
test('keeps an empty duration invalid while accepting whole minutes', () => {
  assert.equal(parseWorkoutDuration(''), null);
  assert.equal(parseWorkoutDuration('30'), 30);
  for (const value of ['0', '1.5', '361', 'abc']) assert.equal(parseWorkoutDuration(value), null);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/workoutInput.test.ts`

Expected: FAIL because `workoutInput.ts` does not exist.

- [ ] **Step 3: Implement strict duration parsing**

```ts
export function parseWorkoutDuration(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const minutes = Number(value);
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 360 ? minutes : null;
}
```

- [ ] **Step 4: Convert the modal to a string duration draft**

Initialize `durationDraft` to `'45'`. Preset selection assigns `String(preset.defaultMinutes)`. Calculate calories only from a valid parsed duration; show `—` while invalid. Add 15, 30, 45, and 60 minute chips. On submit, retain the draft, show “Enter 1–360 whole minutes,” and block saving when invalid.

- [ ] **Step 5: Align and simplify workout content**

Use stacked fields below 640px and a two-column grid above it. Give all visible field labels the shared `app-field-label` class. Move the Calculated badge beside the calorie value. Make the recorded count a separate header badge, keep it on one line, and remove uppercase/tracking styles that hurt Arabic and Kurdish. Use horizontal overflow for category chips and a two-column preset list only above the mobile breakpoint.

- [ ] **Step 6: Translate, test, and build**

Add Arabic and Kurdish Sorani text for quick duration labels and validation.

Run: `node --test tests/workoutInput.test.ts && npm test && npm run lint && npm run build`

Expected: all commands pass.

- [ ] **Step 7: Commit the workout repair**

```bash
git add src/utils/workoutInput.ts src/components/AddWorkoutModal.tsx src/App.tsx src/locales/ar.json src/locales/ckb.json tests/workoutInput.test.ts
git commit -m "fix: make workout entry editable and responsive"
```

### Task 6: Apply the Midnight Sage design system and mobile safeguards

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/DailySummary.tsx`
- Modify: `src/components/MealTracker.tsx`
- Modify: `src/components/WellnessPanel.tsx`
- Modify: `src/components/ProfileModal.tsx`
- Modify: `src/components/AddWorkoutModal.tsx`

**Interfaces:**
- Produces: reusable CSS classes `app-surface`, `app-surface-muted`, `app-button-primary`, `app-button-secondary`, `app-field`, `app-field-label`, `app-chip`, and `app-modal`.

- [ ] **Step 1: Define calm shared tokens and component classes**

Add CSS custom properties for navy canvas, blue-gray surfaces, sage accent, teal accent, amber attention, coral danger, text, muted text, and borders. Define component classes using those variables, 44px controls, consistent 12–16px radii, and restrained shadows.

Replace the global rules that force word fragmentation:

```css
p, h1, h2, h3, label, button { overflow-wrap: normal; word-break: normal; }
.app-copy { overflow-wrap: break-word; }
.app-control-label { white-space: nowrap; }
.app-scroll-row { overflow-x: auto; scrollbar-width: none; }
```

- [ ] **Step 2: Restyle the main dashboard hierarchy**

Apply the shared surfaces and buttons to the page shell, navigation, daily summary, meal tracker, nutrition, and workout sections. Use sage/teal for primary actions; reserve amber for reminders and coral for errors/delete. Remove saturated multi-color gradients and strong colored glows from these screens.

- [ ] **Step 3: Add narrow-phone and RTL protections**

At widths below 390px, reduce page padding, keep bottom navigation labels intact, stack metric rows that cannot fit, and allow chip rows to scroll. Use logical properties and `html[dir="rtl"]` rules so alignment reverses without reversing numeric input direction. Ensure modals use `max-height: min(88dvh, 760px)` with independently scrolling bodies and fixed headers/footers.

- [ ] **Step 4: Run static verification**

Run: `rg -n "overflow-wrap: anywhere|word-break: break-all|from-rose-500 to-orange-500" src`

Expected: no matches in the refreshed dashboard, nutrition, profile/settings, or workout paths.

Run: `npm run lint && npm run build && npm test`

Expected: all commands pass.

- [ ] **Step 5: Inspect responsive views**

Open the production app at 360×800 and 390×844 in English, Arabic, and Kurdish Sorani. Verify no horizontal page scroll, all close/save buttons remain visible, tabs expose selected state, workout labels align, duration can be cleared and replaced, and complete words remain intact.

- [ ] **Step 6: Commit the visual refresh**

```bash
git add src/index.css src/App.tsx src/components/Navbar.tsx src/components/DailySummary.tsx src/components/MealTracker.tsx src/components/WellnessPanel.tsx src/components/ProfileModal.tsx src/components/AddWorkoutModal.tsx
git commit -m "style: apply Midnight Sage mobile design"
```

### Task 7: Release verification and Android test package

**Files:**
- Modify: `README.md`
- Modify: `MOBILE-SETUP.md`

**Interfaces:**
- Consumes: completed Tasks 1–6.
- Produces: verified web build, synchronized Android project, and documented tester notes.

- [ ] **Step 1: Document the feature and tester workflow**

Update the feature list with manual nutrient entries, settings-based notification scheduling, and the redesigned workout form. Document that users should export JSON before replacing a debug-signed APK and that a newly signed CI APK may require registering its Firebase SHA fingerprint.

- [ ] **Step 2: Run the complete local gate**

Run: `npm test && npm run lint && npm run build && npx cap sync android`

Expected: all tests pass, TypeScript emits no errors, Vite completes, and Capacitor copies the web build and plugins successfully.

- [ ] **Step 3: Review generated changes**

Inspect the changed file list and generated Android config. Confirm no API key, service-account key, password, signing keystore, `node_modules`, or `dist` output is staged for source control.

- [ ] **Step 4: Commit release documentation**

```bash
git add README.md MOBILE-SETUP.md
git commit -m "docs: update premium beta testing guide"
```

- [ ] **Step 5: Publish after local verification**

Push the source changes to `sahand-git/fittrack-mobile`, run the Android build workflow, verify the workflow succeeds, attach the generated `FitTrack.apk` to a new prerelease, and provide the permanent GitHub release URL plus the APK SHA-256 checksum.

