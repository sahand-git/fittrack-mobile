# Reminders and nutrients

User decisions: track both food micronutrients and supplements; each user chooses times during setup. Cloud backup remains disabled by owner choice.

Use local phone notifications, which work without a server. A server push alternative would require cloud activity records and ongoing infrastructure, conflicting with the current offline beta. Add a setup screen after the existing profile onboarding and an editable dashboard entry. No notifications until the user chooses times and grants phone permission. Support breakfast, lunch, dinner, water, and up to five daily supplements. All reminders are optional. Supplement amounts are entered by the user; the app does not recommend doses.

Schedule the next three days, capped at 60 pending notifications, and refresh on opening, changing settings, or logging. Cancel a meal reminder once that meal is logged on its date. Water reminders recur in chosen daytime hours and skip an interval after water is logged, or stop for the day when the goal is met. Supplement reminders stop for that date after marking taken. Use local calendar dates, never the currently viewed historical date, to choose future notifications. Clear pending reminders on sign-out/account changes. Explain that users must reopen periodically to replenish reminders and that phone battery settings can delay them. Web builds offer nutrient tracking but clearly identify phone notifications as native-only.

Store reminder settings and supplement definitions in the per-account profile, and water log timestamps and supplement completion in daily logs. Include these optional fields in JSON backups with strict validation and backward compatibility. Notification permission is device-specific and is never granted by importing a backup.

Track calcium, iron, magnesium, potassium, zinc, vitamin C, vitamin D and vitamin B12. Store explicit mg or microgram units. Add trusted USDA SR28 values by matching the existing NDB IDs, accept known Open Food Facts values with correct conversion, and allow entry of label values. Missing values stay missing. Show food totals with coverage counts; supplement completion is separate from food totals.

Use English, Arabic and Sorani labels and a wrapping mobile layout. Verify pure scheduling (logging cancellation, date changes, water intervals, account cleanup), nutrient units/scaling, JSON round trips, type checking, production build, and narrow RTL screens before distributing the next APK. Physical notification delivery must be tested on a phone.
