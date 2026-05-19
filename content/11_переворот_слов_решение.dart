// ============================================================
// РЕШЕНИЕ: Переставить слова без сдвига пробелов
// ============================================================

String reverseWords(String s) {
  if (s.isEmpty) return s;

  // ШАГ 1: Извлекаем все слова из строки (игнорируя пробелы)
  final words = <String>[];
  int i = 0;

  while (i < s.length) {
    if (s[i] != ' ') {
      // Нашли начало слова — ищем его конец
      int j = i;
      while (j < s.length && s[j] != ' ') j++;
      // s.substring(i, j) — слово от i до j (не включая j)
      words.add(s.substring(i, j));
      i = j; // перепрыгиваем к позиции после слова
    } else {
      i++;
    }
  }

  // Если слов нет (только пробелы) — возвращаем как есть
  if (words.isEmpty) return s;

  // ШАГ 2: Разворачиваем список слов
  // reversed — это Iterable, toList() делает изменяемый список
  final reversed = words.reversed.toList();

  // ШАГ 3: Строим результат
  // Превращаем строку в массив символов чтобы менять по индексу
  final chars = s.split('');
  int wordIdx = 0; // индекс в списке перевёрнутых слов
  i = 0;

  while (i < s.length) {
    if (chars[i] != ' ') {
      // Нашли позицию слова в оригинальной строке
      // Вставляем туда следующее слово из reversed
      final word = reversed[wordIdx++];
      for (int k = 0; k < word.length; k++) {
        chars[i + k] = word[k];
      }
      // Перепрыгиваем через всё слово
      i += word.length;
    } else {
      i++;
    }
  }

  // Собираем символы обратно в строку
  return chars.join();
}
