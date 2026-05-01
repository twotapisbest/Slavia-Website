// filepath: app/composables/useExternalCompetitions.ts
import { ref } from 'vue'

export interface ExternalCompetition {
  id: string
  title: string
  date: string
  location: string
  category: 'championship' | 'league' | 'club_event' | 'training'
  source: 'pzpc' | 'slpc' | 'podnoszenieciezarow' | 'manual'
  description?: string
  url?: string
}

/**
 * Composable do pobierania zawodów z zewnętrznych źródeł.
 * Uwaga: PZPC, SLPC i podnoszenieciezarow.pl nie mają publicznych API.
 * Ten composable służy jako baza do przyszłej integracji lub ręcznego importu.
 * 
 * W przyszłości można rozszerzyć o:
 * - Web scraping z kalendarza PZPC (https://pzpc.pl/strefa-sportowa/kalendarz-imprez)
 * - API podnoszenieciezarow.pl (wymaga konta Premium)
 * - Scrapowanie SLPC
 */
export function useExternalCompetitions() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const competitions = ref<ExternalCompetition[]>([])

  /**
   * Próbuje pobrać zawody z PZPC.
   * Wymaga implementacji web scrapingu lub API.
   */
  async function fetchFromPZPC(): Promise<ExternalCompetition[]> {
    // TODO: Implementacja scrapingu z https://pzpc.pl/strefa-sportowa/kalendarz-imprez
    // Na razie zwracamy przykładowe dane z kalendarza PZPC na Maj 2026
    return [
      {
        id: 'pzpc-2026-0502',
        title: 'Zawody Pucharu Świata',
        date: '2026-05-02',
        location: 'Apia (Samoa)',
        category: 'championship',
        source: 'pzpc',
        url: 'https://pzpc.pl/strefa-sportowa/kalendarz-imprez/centralne/1426'
      },
      {
        id: 'pzpc-2026-0508',
        title: 'MŚ U20 - Ismailia',
        date: '2026-05-08',
        location: 'Ismailia (Egipt)',
        category: 'championship',
        source: 'pzpc',
        url: 'https://pzpc.pl/strefa-sportowa/kalendarz-imprez/centralne/1427'
      },
      {
        id: 'pzpc-2026-0510',
        title: 'Otwarte Mistrzostwa Mazowsza U20 i U23',
        date: '2026-05-10',
        location: 'Ciechanów',
        category: 'league',
        source: 'pzpc',
        url: 'https://pzpc.pl/strefa-sportowa/kalendarz-imprez/okregowe/1472'
      },
      {
        id: 'pzpc-2026-0516',
        title: 'Memoriał Stefana Polaczuka',
        date: '2026-05-16',
        location: 'Terespol',
        category: 'league',
        source: 'pzpc',
        url: 'https://pzpc.pl/strefa-sportowa/kalendarz-imprez/okregowe/1456'
      },
      {
        id: 'pzpc-2026-0522',
        title: 'III Runda DMP',
        date: '2026-05-22',
        location: 'Polska',
        category: 'championship',
        source: 'pzpc',
        url: 'https://pzpc.pl/strefa-sportowa/kalendarz-imprez/centralne/1428'
      },
      {
        id: 'pzpc-2026-0523',
        title: 'Puchar Polski AZS',
        date: '2026-05-23',
        location: 'Polska',
        category: 'league',
        source: 'pzpc',
        url: 'https://pzpc.pl/strefa-sportowa/kalendarz-imprez/centralne/1429'
      },
      {
        id: 'pzpc-2026-0523-warszawa',
        title: 'Turniej o Puchar im. Gen. Dyw. Kazimierza Gilarskiego',
        date: '2026-05-23',
        location: 'Warszawa',
        category: 'league',
        source: 'pzpc',
        url: 'https://pzpc.pl/strefa-sportowa/kalendarz-imprez/okregowe/1473'
      },
      {
        id: 'pzpc-2026-0529',
        title: 'Mistrzostwa Mazowsza U15',
        date: '2026-05-29',
        location: 'Siedlce',
        category: 'league',
        source: 'pzpc',
        url: 'https://pzpc.pl/strefa-sportowa/kalendarz-imprez/okregowe/1474'
      },
      {
        id: 'pzpc-2026-0530',
        title: 'Młodzieżowe Mistrzostwa Polski do lat 23',
        date: '2026-05-30',
        location: 'Ciechanów',
        category: 'championship',
        source: 'pzpc',
        url: 'https://pzpc.pl/strefa-sportowa/kalendarz-imprez/centralne/1430'
      }
    ]
  }

  /**
   * Próbuje pobrać zawody z Śląskiego Związku Podnoszenia Ciężarów (SLPC).
   */
  async function fetchFromSLPC(): Promise<ExternalCompetition[]> {
    // TODO: Implementacja - brak publicznego API/strony
    // Zwracamy przykładowe zawody śląskie na podstawie danych z PZPC
    return [
      {
        id: 'slpc-2026-0500',
        title: 'Śląska Liga U23 - III Runda',
        date: '2026-05-01',
        location: 'Śląsk',
        category: 'league',
        source: 'slpc'
      }
    ]
  }

  /**
   * Próbuje pobrać zawody z podnoszenieciezarow.pl.
   */
  async function fetchFromPodnoszenieCiezarow(): Promise<ExternalCompetition[]> {
    // TODO: Implementacja - wymaga konta Premium lub scrapingu
    // Serwis nie ma publicznego API
    return []
  }

  /**
   * Pobiera wszystkie zawody z zewnętrznych źródeł.
   */
  async function fetchAll(): Promise<ExternalCompetition[]> {
    loading.value = true
    error.value = null
    
    try {
      const [pzpc, slpc, pce] = await Promise.all([
        fetchFromPZPC().catch(e => {
          console.warn('Błąd pobierania z PZPC:', e)
          return []
        }),
        fetchFromSLPC().catch(e => {
          console.warn('Błąd pobierania z SLPC:', e)
          return []
        }),
        fetchFromPodnoszenieCiezarow().catch(e => {
          console.warn('Błąd pobierania z podnoszenieciezarow.pl:', e)
          return []
        })
      ])
      
      competitions.value = [...pzpc, ...slpc, ...pce]
      return competitions.value
    } catch (e) {
      error.value = String(e)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Dodaje zawód ręcznie.
   */
  function addManualCompetition(competition: Omit<ExternalCompetition, 'id' | 'source'>) {
    const newComp: ExternalCompetition = {
      ...competition,
      id: `manual-${Date.now()}`,
      source: 'manual'
    }
    competitions.value.push(newComp)
    return newComp
  }

  /**
   * Usuwa zawód z listy.
   */
  function removeCompetition(id: string) {
    competitions.value = competitions.value.filter(c => c.id !== id)
  }

  /**
   * Filtruje zawody według kategorii.
   */
  function filterByCategory(category: ExternalCompetition['category']) {
    return competitions.value.filter(c => c.category === category)
  }

  /**
   * Filtruje zawody według źródła.
   */
  function filterBySource(source: ExternalCompetition['source']) {
    return competitions.value.filter(c => c.source === source)
  }

  return {
    loading,
    error,
    competitions,
    fetchFromPZPC,
    fetchFromSLPC,
    fetchFromPodnoszenieCiezarow,
    fetchAll,
    addManualCompetition,
    removeCompetition,
    filterByCategory,
    filterBySource
  }
}