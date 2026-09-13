/**
 * FitTrack Central Design Tokens
 * Single source of truth for color palette, layout, spacing, typography, and elevation.
 * Theme: Bright, calm, professional daily health aesthetic.
 */

export const tokens = {
  colors: {
    // Canvas & Neutral Backgrounds
    bgApp: 'bg-slate-50', // #F8FAFC
    bgSurface: 'bg-white', // #FFFFFF
    bgSurfaceSubtle: 'bg-slate-50/80',
    bgSurfaceMuted: 'bg-slate-100/70',

    // Borders
    borderSubtle: 'border-slate-100',
    borderDefault: 'border-slate-200/80',
    borderStrong: 'border-slate-300',

    // High-Legibility Typography
    textPrimary: 'text-slate-900', // #0F172A
    textSecondary: 'text-slate-600', // #475569
    textMuted: 'text-slate-400', // #94A3B8
    textInverse: 'text-white',

    // Confident Calm Accent (Serene Deep Teal - Clinical, trustworthy, non-neon)
    accent: {
      primary: 'text-teal-600',
      primaryBg: 'bg-teal-600',
      primaryHover: 'hover:bg-teal-700',
      primaryActive: 'active:bg-teal-800',
      tintBg: 'bg-teal-50',
      tintBorder: 'border-teal-200',
      tintText: 'text-teal-700',
      gradient: 'bg-gradient-to-r from-teal-600 to-emerald-600',
      shadow: 'shadow-teal-600/15',
    },

    // Functional Semantic Palettes (Muted, professional pastels)
    functional: {
      calorie: {
        bg: 'bg-teal-50',
        border: 'border-teal-100',
        text: 'text-teal-700',
        indicator: 'bg-teal-600',
        barGradient: 'from-teal-500 to-emerald-500',
      },
      protein: {
        bg: 'bg-sky-50',
        border: 'border-sky-100',
        text: 'text-sky-700',
        indicator: 'bg-sky-600',
      },
      carbs: {
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        text: 'text-amber-700',
        indicator: 'bg-amber-500',
      },
      fat: {
        bg: 'bg-violet-50',
        border: 'border-violet-100',
        text: 'text-violet-700',
        indicator: 'bg-violet-500',
      },
      workout: {
        bg: 'bg-rose-50',
        border: 'border-rose-100',
        text: 'text-rose-700',
        indicator: 'bg-rose-500',
        buttonGradient: 'from-rose-500 to-orange-500',
      },
      steps: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        text: 'text-emerald-700',
        indicator: 'bg-emerald-600',
      },
      water: {
        bg: 'bg-cyan-50',
        border: 'border-cyan-100',
        text: 'text-cyan-700',
        indicator: 'bg-cyan-500',
      },
      vitamins: {
        bg: 'bg-indigo-50',
        border: 'border-indigo-100',
        text: 'text-indigo-700',
        indicator: 'bg-indigo-600',
      },
      streak: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        icon: 'text-orange-500 fill-orange-500',
      },
    },
  },

  // Layout & Cards
  layout: {
    container: 'max-w-6xl w-full mx-auto px-4 py-6 space-y-6 flex-1',
    card: 'bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow',
    cardSubtle: 'bg-slate-50 border border-slate-100 rounded-2xl p-4',
    modal: 'bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl',
  },

  // Consistent Icon Configuration
  icons: {
    strokeWidth: 1.75,
    sizeSm: 16,
    sizeMd: 20,
    sizeLg: 24,
  },
} as const;

export type DesignTokens = typeof tokens;
