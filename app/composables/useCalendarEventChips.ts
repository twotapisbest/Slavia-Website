/**
 * Wspólna kolorystyka i ikony „chipek” w kalendarzu klubu i kalendarzu osobistym zawodnika.
 */
export type CalendarChipEvent = {
  type?: string
  category?: string | null
  status?: string | null
}

export function useCalendarEventChips () {
  function getEventClasses (event: CalendarChipEvent) {
    if (event.type === 'training' || event.category === 'training')
      return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    const cat = event.category || 'club_event'
    if (event.status === 'cancelled') return 'bg-gray-500/10 border-gray-500/40 text-gray-400 line-through'
    if (event.status === 'moved') return 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold'
    if (cat === 'championship') return 'bg-red-500/15 border-red-500/40 text-red-400 font-bold'
    if (cat === 'league') return 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold'
    return 'bg-teal-500/15 border-teal-500/40 text-teal-400 font-bold'
  }

  function getEventIcon (event: CalendarChipEvent) {
    if (event.type === 'training') return 'i-lucide-dumbbell'
    const cat = event.category || 'club_event'
    if (cat === 'championship') return 'i-lucide-trophy'
    if (cat === 'league') return 'i-lucide-medal'
    return 'i-lucide-star'
  }

  return { getEventClasses, getEventIcon }
}
