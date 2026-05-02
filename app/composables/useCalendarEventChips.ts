/**
 * Wspólna kolorystyka i ikony „chipek” w kalendarzu klubu i kalendarzu osobistym zawodnika.
 */
export type CalendarChipEvent = {
  type?: string
  category?: string | null
  status?: string | null
  external_source?: string | null
}

export function useCalendarEventChips() {
  function getEventClasses(event: CalendarChipEvent) {
    if (event.type === 'training' || event.category === 'training')
      return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    if (event.external_source)
      return 'bg-indigo-500/12 border-indigo-500/35 text-indigo-300'
    const cat = event.category || 'club_event'
    if (event.status === 'cancelled') return 'bg-gray-500/10 border-gray-500/40 text-gray-400 line-through'
    if (event.status === 'moved') return 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold'
    if (cat === 'championship') return 'bg-red-500/15 border-red-500/40 text-red-400 font-bold'
    if (cat === 'league') return 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold'
    return 'bg-teal-500/15 border-teal-500/40 text-teal-400 font-bold'
  }

  function getEventIcon(event: CalendarChipEvent) {
    if (event.type === 'training') return 'i-lucide-dumbbell'
    if (event.external_source) return 'i-lucide-globe'
    const cat = event.category || 'club_event'
    if (cat === 'championship') return 'i-lucide-trophy'
    if (cat === 'league') return 'i-lucide-medal'
    return 'i-lucide-star'
  }

  /** Nagłówek modala — gradient + pierścień (Tailwind). */
  function getEventModalHeaderClass(event: CalendarChipEvent) {
    if (event.type === 'training' || event.category === 'training') {
      return 'bg-linear-to-br from-blue-600 via-blue-700 to-slate-950 text-white ring-2 ring-blue-400/40 shadow-[0_20px_50px_-15px_rgba(37,99,235,0.55)]'
    }
    if (event.external_source) {
      return 'bg-linear-to-br from-indigo-600 via-violet-800 to-slate-950 text-white ring-2 ring-indigo-400/35 shadow-[0_20px_50px_-15px_rgba(99,102,241,0.5)]'
    }
    const cat = event.category || 'club_event'
    if (event.status === 'cancelled') {
      return 'bg-linear-to-br from-zinc-600 via-zinc-800 to-neutral-950 text-white ring-2 ring-zinc-500/40 opacity-95'
    }
    if (event.status === 'moved') {
      return 'bg-linear-to-br from-amber-500 via-orange-700 to-neutral-950 text-white ring-2 ring-amber-400/45 shadow-[0_20px_50px_-15px_rgba(245,158,11,0.45)]'
    }
    if (cat === 'championship') {
      return 'bg-linear-to-br from-red-600 via-rose-800 to-neutral-950 text-white ring-2 ring-red-400/40 shadow-[0_20px_50px_-15px_rgba(239,68,68,0.45)]'
    }
    if (cat === 'league') {
      return 'bg-linear-to-br from-amber-500 via-amber-700 to-neutral-950 text-white ring-2 ring-amber-300/40 shadow-[0_20px_50px_-15px_rgba(245,158,11,0.4)]'
    }
    return 'bg-linear-to-br from-teal-600 via-emerald-800 to-slate-950 text-white ring-2 ring-teal-400/35 shadow-[0_20px_50px_-15px_rgba(20,184,166,0.45)]'
  }

  function getEventKindLabel(event: CalendarChipEvent) {
    if (event.type === 'training' || event.category === 'training') return 'Trening klubowy'
    if (event.external_source) return 'Import zewnętrzny'
    const cat = event.category || 'club_event'
    if (cat === 'championship') return 'Mistrzostwa / zawody ogólne'
    if (cat === 'league') return 'Liga'
    return 'Wydarzenie klubowe'
  }

  return { getEventClasses, getEventIcon, getEventModalHeaderClass, getEventKindLabel }
}
