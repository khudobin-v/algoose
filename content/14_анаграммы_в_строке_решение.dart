// ============================================================
// ЗАДАЧА: Найти все анаграммы строки s в строке t
// ============================================================
// Найти все стартовые индексы подстрок строки t, которые являются
// анаграммами строки s. Анаграмма — перестановка букв.
//
// Примеры:
//   findAnagrams("cbaebabacd", "abc") → [0, 6]
//   findAnagrams("abab", "ab")        → [0, 1, 2]
//   findAnagrams("hello", "ll")       → [2]
// ============================================================

List<int> findAnagrams(String t, String s) {
  // Если s длиннее t — анаграмм нет
  if (s.length > t.length) return [];

  final result = <int>[];

  // Частотный массив для s — сколько раз каждая буква встречается в s
  // Используем массив из 26 элементов (только маленькие латинские буквы)
  final sCount = List<int>.filled(26, 0);
  // Частотный массив для текущего окна в t
  final windowCount = List<int>.filled(26, 0);

  // Код буквы 'a' — вычитаем его чтобы получить индекс 0-25
  final aCode = 'a'.codeUnitAt(0);

  // Заполняем частоты для s и первого окна t длиной s.length
  for (int i = 0; i < s.length; i++) {
    sCount[s.codeUnitAt(i) - aCode]++;       // частоты символов s
    windowCount[t.codeUnitAt(i) - aCode]++;  // частоты первого окна t
  }

  // Проверяем первое окно
  if (_arraysEqual(sCount, windowCount)) result.add(0);

  // Скользящее окно: двигаем правую границу, убираем левый символ
  for (int i = s.length; i < t.length; i++) {
    // Добавляем новый правый символ в окно
    windowCount[t.codeUnitAt(i) - aCode]++;

    // Убираем левый символ (который вышел из окна)
    // Левый символ — это t[i - s.length]
    windowCount[t.codeUnitAt(i - s.length) - aCode]--;

    // Если частоты совпадают — нашли анаграмму
    // Начало окна: i - s.length + 1
    if (_arraysEqual(sCount, windowCount)) {
      result.add(i - s.length + 1);
    }
  }

  return result;
}

// Сравнивает два массива поэлементно
bool _arraysEqual(List<int> a, List<int> b) {
  for (int i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false; // хотя бы одно отличие — не равны
  }
  return true; // все элементы совпали
}
