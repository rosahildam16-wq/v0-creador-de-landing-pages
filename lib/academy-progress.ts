import { COURSES, Course } from "./courses-data"
import { updateMemberProgress } from "./team-data"

export interface AcademyProgress {
  completedLessons: string[] // Array of lesson IDs
}

const STORAGE_KEY = "mf_academy_progress"

export function getAcademyProgress(): AcademyProgress {
  if (typeof window === "undefined") return { completedLessons: [] }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (e) {
    console.error("Error reading academy progress:", e)
  }
  return { completedLessons: [] }
}

export function saveAcademyProgress(progress: AcademyProgress) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (e) {
    console.error("Error saving academy progress:", e)
  }
}

export function toggleLessonCompletion(lessonId: string, memberId: string) {
  const current = getAcademyProgress()
  const isCompleted = current.completedLessons.includes(lessonId)
  
  let nextLessons = []
  if (isCompleted) {
    nextLessons = current.completedLessons.filter(id => id !== lessonId)
  } else {
    nextLessons = [...current.completedLessons, lessonId]
  }
  
  const nextProgress = { completedLessons: nextLessons }
  saveAcademyProgress(nextProgress)
  
  // Calculate and update global member progress
  const globalProgress = calculateGlobalProgress(nextProgress.completedLessons.length)
  updateMemberProgress(memberId, globalProgress)
  
  return !isCompleted
}

export function isLessonCompleted(lessonId: string): boolean {
  const current = getAcademyProgress()
  return current.completedLessons.includes(lessonId)
}

function calculateGlobalProgress(completedCount: number): number {
  // Total lessons in the academy (we can adjust this to filter by member community if needed)
  const totalLessons = COURSES.reduce((acc, course) => acc + course.totalLecciones, 0)
  if (totalLessons === 0) return 0
  
  return Math.round((completedCount / totalLessons) * 100)
}
