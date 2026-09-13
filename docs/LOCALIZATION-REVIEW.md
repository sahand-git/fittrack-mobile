# Sorani and regional food review

Reviewed September 2026. Public brand: **Calorie Pewar**. Support: **sahandabas2@gmail.com**.

## Scope and changes

Read the full Sorani catalog in alphabetical chunks, then checked every catalog entry with script, untranslated-text, corrupted-marker, key-parity and interpolation audits. This includes onboarding, authentication, privacy/consent, backup, meals, water, supplements, workouts, steps, error messages, accessibility labels and food references. English lookup keys and technical identifiers remain stable so existing callers and saved records keep working. Proper names (Google, Gemini, Apple Health, Health Connect, USDA, product brands), API identifiers and technical formula symbols can intentionally remain in Latin script.

Corrected substantive mistranslations: Disabled no longer refers to disability; Watch refers to a watch; coach refers to a trainer; servings refer to food portions rather than services; deleting an entry refers to a log rather than signing in; Gemini is no longer translated as twins. Removed a duplicated translation marker, stray brackets, Arabic category names, and misleading translations of cooked dry heat as oil-free. Corrected privacy/backup explanations that omitted data handling, mistranslated uninstalling, or mixed untranslated action names. Standardized the public brand in translated values.

Added Sorani and Arabic translations for every regional food name, serving and shared source/category label. Regional entries now number 39, including bamia, fasolia, maqluba, quzi, chicken shawarma, kalana, shifta and unsweetened black tea. Searches normalize Arabic/Persian letter and numeral variants plus invisible joining/direction marks.

## Glossary

| English | Sorani |
|---|---|
| Calories | کالۆری |
| Protein | پرۆتین |
| Carbohydrates / carbs | کاربۆهایدرات |
| Fat | چەوری |
| Hydration | ئاوخواردنەوە |
| Steps | هەنگاوەکان |
| Serving / portion | بەش |
| Meal | ژەم |
| Workout | ڕاهێنان |
| Backup | پاشەکەوت |
| Privacy notice | ئاگاداریی تایبەتمەندی |

## Food accuracy and provenance

Regional nutrition values are **recipe estimates per stated portion**, not laboratory measurements or verified database results. Recipes differ with oil, meat cut, filling, preparation and serving size. No additional sodium values were invented for new recipes. A numeric plausibility test checks portions, nonnegative macros and broad agreement with macro energy; it cannot verify nutritional accuracy.

Mosul kubba is labeled as the boiled preparation, with a corresponding lower-fat estimate. Boiling before optional frying is described in [Marga's Iraqi recipe](https://www.marga.org/food/int/iraq/kubba.html) and a [recipe demonstration by Cooking for Fun](https://www.youtube.com/watch?v=pVdlFOQly7Y). Tirshik now describes a tomato and mixed-vegetable preparation, consistent with the [Kurdish Institute's vegetarian menu](https://www.kurdishinstitute.be/organiseer-een-koerdisch-etentje-voor-rojava-en-shengal-tijdens-de-warmste-week/); the name has regional variations. These sources inform preparation names, not calorie values.

Unsubstantiated specific identities were replaced by descriptive names: lamb/potato stew, meat dumplings with yogurt/garlic, grilled minced-meat patties and rice kubba with split peas. Samoon has its own name instead of conflating bread types. Qaymak explicitly excludes honey, matching the low-carbohydrate estimate. Existing IDs remain unchanged to preserve saved-log compatibility.

## Verification and limits

Tests cover catalog key parity, nonempty translations, interpolation preservation, known semantic regressions, script corruption, glossary consistency, recipe integrity, both regional catalogs and familiar Sorani food searches. A TypeScript AST audit also checks active static `t(...)` literals and conditional branches, scientific-reference section arrays, and AI/storage error literals in both catalogs. It does not prove coverage of arbitrary runtime strings or user-entered text. These checks are repeatable with `node --test tests/locale*.test.ts tests/regionalFoods.test.ts`.

The new server-mediated AI consent/access panel, account access modal, source explanations, persistence/recovery messages and Calorie Pewar branding have Sorani and Arabic entries. The seven-section privacy notice in `public/privacy-data.json` has complete Sorani and Arabic translations preserving the English section structure, conditional retention statements, session consent scope, export/deletion exclusions and support address. This is translation of the supplied policy, not independent legal review. Thirteen targeted tests passed after this follow-up.

This is a comprehensive catalog/code review, **not certification by a native Sorani editor or a dietitian**. Dialect preference, idiom and final mobile line wrapping still benefit from native-speaker review on actual screens. Legacy catalog keys include internal strings and retired UI copy; retaining their keys does not endorse old scientific or product claims. Arabic received parity, regional-food and branding updates, not an independent full linguistic certification.
