import { apiRoutes } from '~/config/api'
import type { ExerciseBoardRow } from '~/types/models'

function toNum(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return null
  return Math.round(value * 10) / 10
}

export function useExercisesBoard() {
  const apiFetch = useApi()

  async function fetchBoard(): Promise<ExerciseBoardRow[]> {
    return apiFetch<ExerciseBoardRow[]>(apiRoutes.exercises.board).catch(() => [])
  }

  function withTotal(rows: ExerciseBoardRow[]) {
    return rows.map(row => {
      const squat = toNum(row.squat_kg)
      const bench = toNum(row.bench_kg)
      const deadlift = toNum(row.deadlift_kg)
      const total = (squat || 0) + (bench || 0) + (deadlift || 0)
      return {
        ...row,
        squat,
        bench,
        deadlift,
        total: total > 0 ? Math.round(total * 10) / 10 : null
      }
    })
  }

  return {
    fetchBoard,
    withTotal
  }
}
