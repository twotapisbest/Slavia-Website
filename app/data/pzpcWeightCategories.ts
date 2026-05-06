/**
 * Kategorie wagowe z aktów/rozpiski PZPC dla grup wiekowych (szablon pod trening i wpisy startowe).
 * Senior/U23/U20/U17 — wg aktualnych widełek międzynarodowych stosowanych w Polsce; U15 — typowy zestaw młodziczy.
 * Przy zmianie regulaminu zaktualizuj tablice i dopisz komentarz z datą.
 */
export type PzpcAgeGroupId = 'U15' | 'U17' | 'U20' | 'U23' | 'Senior'

export const PZPC_AGE_GROUPS: { id: PzpcAgeGroupId; label: string }[] = [
  { id: 'U15', label: 'U15 (młodziczki / młodzicy)' },
  { id: 'U17', label: 'U17 (juniorki mł. / juniorzy mł.)' },
  { id: 'U20', label: 'U20 (juniorki / juniorzy)' },
  { id: 'U23', label: 'U23 (młodzieżowcy)' },
  { id: 'Senior', label: 'Senior' }
]

/** Etykiety klas wagowych do selecta (bez „kg” w wartości — dopisujemy w UI). */
export function pzpcWeightClassLabels(age: PzpcAgeGroupId, gender: 'male' | 'female'): string[] {
  if (age === 'U15') {
    return gender === 'male'
      ? ['45', '50', '56', '62', '69', '77', '85', '+85']
      : ['44', '48', '53', '58', '63', '69', '75', '+75']
  }
  // U17–Senior (wzór jak w zawodach seniorskich / młodszych kategoriach z wyjątkiem U15)
  return gender === 'male'
    ? ['56', '62', '69', '77', '85', '94', '105', '+105']
    : ['48', '53', '58', '63', '69', '75', '90', '+90']
}

export function formatPzpcWeightCategory(
  age: PzpcAgeGroupId,
  gender: 'male' | 'female',
  classLabel: string
): string {
  const g = gender === 'male' ? 'M' : 'K'
  const kg = classLabel.startsWith('+') ? `${classLabel} kg` : `${classLabel} kg`
  return `${age} ${g} — ${kg}`
}

/** Odczyt wartości zapisanej przez `formatPzpcWeightCategory`. */
export function parsePzpcWeightCategoryStored(raw: string | null | undefined): {
  age: PzpcAgeGroupId
  gender: 'male' | 'female'
  classLabel: string
} | null {
  if (!raw?.trim()) return null
  const m = /^(\w+)\s+([MK])\s+—\s+(.+)$/u.exec(raw.trim())
  if (!m) return null
  const ageId = m[1] as PzpcAgeGroupId
  if (!PZPC_AGE_GROUPS.some(x => x.id === ageId)) return null
  const mk = m[2]
  const tail = m[3]
  if (mk == null || tail == null) return null
  const gender = mk === 'M' ? 'male' : 'female'
  const cls = tail.replace(/\s*kg\s*$/iu, '').trim()
  if (!cls) return null
  return { age: ageId, gender, classLabel: cls }
}
