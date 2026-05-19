import fs from 'fs'
import path from 'path'

const BASE_DIR = path.resolve(process.cwd(), '..')

export const PRIORITY: Record<number, 'red' | 'orange' | 'yellow'> = {}
for (let n = 1; n <= 13; n++) PRIORITY[n] = 'red'
for (let n = 14; n <= 20; n++) PRIORITY[n] = 'orange'
for (let n = 21; n <= 38; n++) PRIORITY[n] = 'yellow'
PRIORITY[18] = 'red'
PRIORITY[38] = 'red'

export const PRIORITY_LABEL: Record<string, string> = {
  red: 'Подтверждённые собесами',
  orange: 'Встречаются часто',
  yellow: 'Встречаются редко',
}

export const TASK_FILES: Record<number, string> = {
  1: '01_сжатие_строки_rle',
  2: '02_подмассив_с_суммой',
  3: '03_подстрока_без_повторов',
  4: '04_монотонный_подмассив',
  5: '05_сводка_диапазонов',
  6: '06_пересечение_отрезков_гостиница',
  7: '07_k_ближайших_элементов',
  8: '08_наименьший_общий_предок',
  9: '09_нечёткий_поиск_подпоследовательность',
  10: '10_одно_редактирование',
  11: '11_переворот_слов',
  12: '12_декодирование_строки',
  13: '13_восстановление_ip',
  14: '14_анаграммы_в_строке',
  15: '15_нормализация_пробелов',
  16: '16_палиндром_удаление_символа',
  17: '17_расстояние_между_символами',
  18: '18_серия_единиц',
  19: '19_пересекающиеся_встречи',
  20: '20_url_кодирование',
  21: '21_одинаковые_поддеревья',
  22: '22_пересечение_массивов',
  23: '23_стек_и_очередь',
  24: '24_скалярное_произведение_векторов',
  25: '25_удаление_нулей',
  26: '26_пары_с_разностью_k',
  27: '27_всплески_активности',
  28: '28_фильтрация_по_списку',
  29: '29_сложение_ступенчатых_функций',
  30: '30_сложение_hex_чисел',
  31: '31_умножение_на_разряд',
  32: '32_удаление_смайликов',
  33: '33_разбиение_на_три_части',
  34: '34_удаление_лишних_дубликатов',
  35: '35_фильтрующий_итератор',
  36: '36_оптимизация_пути',
  37: '37_проверка_симметрии',
  38: '38_серия_единиц_простая',
}

function read(filePath: string): string {
  if (!fs.existsSync(filePath)) return ''
  return fs.readFileSync(filePath, 'utf-8')
}

function splitSections(md: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const parts = ('\n' + md).split(/\n(?=## )/)
  for (const part of parts) {
    const m = part.match(/^## (.+?)\n([\s\S]*)/)
    if (m) sections[m[1].trim()] = m[2].trim()
  }
  return sections
}

function removeDartBlocks(text: string): string {
  text = text.replace(/```dart\n[\s\S]*?```/g, '')
  text = text.replace(/```\n[\s\S]*?```/g, '')
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

function taskTitleFromMd(md: string, fallback: string): string {
  const m = md.match(/^# Задача:\s*(.+)$/m)
  return m ? m[1].trim() : fallback
}

function humanName(prefix: string): string {
  const name = prefix.replace(/^\d+_/, '').replace(/_/g, ' ')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export interface TaskMeta {
  id: number
  name: string
  priority: 'red' | 'orange' | 'yellow'
  prefix: string
}

export interface TaskDetail extends TaskMeta {
  description: string
  hints: string
  solutionEssence: string
  dartCode: string
  complexity: string
}

export function getAllTasks(): TaskMeta[] {
  return Object.entries(TASK_FILES).map(([num, prefix]) => {
    const id = parseInt(num)
    const explPath = path.join(BASE_DIR, `${prefix}_объяснение.md`)
    const md = read(explPath)
    const name = taskTitleFromMd(md, humanName(prefix))
    return { id, name, priority: PRIORITY[id], prefix }
  })
}

export function getTaskDetail(id: number): TaskDetail | null {
  const prefix = TASK_FILES[id]
  if (!prefix) return null

  const explPath = path.join(BASE_DIR, `${prefix}_объяснение.md`)
  const solPath = path.join(BASE_DIR, `${prefix}_решение.dart`)
  const md = read(explPath)
  const dartCode = read(solPath)
  const name = taskTitleFromMd(md, humanName(prefix))

  const sections = splitSections(md)
  const sectionValues = Object.values(sections)

  // First section = description
  const description = sectionValues[0] ?? 'Описание недоступно.'

  // Middle sections (skip first and Dart-code sections) = hints
  const hintParts: string[] = []
  let firstSkipped = false
  for (const [header, body] of Object.entries(sections)) {
    if (!firstSkipped) { firstSkipped = true; continue }
    const h = header.toLowerCase()
    if (h.includes('код') && (h.includes('dart') || h.includes('финальный'))) break
    const cleaned = removeDartBlocks(body)
    if (cleaned) hintParts.push(`### ${header}\n\n${cleaned}`)
  }
  const hints = hintParts.join('\n\n') || 'Подсказки недоступны.'

  // Full explanation without dart code
  const solutionEssence = removeDartBlocks(md)
    .replace(/^#{1,3} /gm, '')

  // Complexity
  const complexityKey = Object.keys(sections).find(k =>
    k.toLowerCase().includes('сложность')
  )
  const complexity = complexityKey ? sections[complexityKey] : 'Не указана'

  return {
    id, name, priority: PRIORITY[id], prefix,
    description, hints, solutionEssence, dartCode, complexity,
  }
}

export function getSolutionCode(id: number): string {
  const prefix = TASK_FILES[id]
  if (!prefix) return ''
  return read(path.join(BASE_DIR, `${prefix}_решение.dart`))
}
