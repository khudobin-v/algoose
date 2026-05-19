// ============================================================
// ЗАДАЧА: Нормализация пробелов
// ============================================================
// Заменить все последовательности пробелов на один пробел.
// Убрать пробелы в начале и конце строки.
//
// Примеры:
//   normalizeSpaces("  hello   world  ") → "hello world"
//   normalizeSpaces("a  b  c")           → "a b c"
//   normalizeSpaces("   ")               → ""
//   normalizeSpaces("hello")             → "hello"
// ============================================================

String normalizeSpaces(String s) {
  // Используем список символов как изменяемый буфер
  final chars = s.split('');

  // writePos — позиция куда пишем следующий символ
  int writePos = 0;
  // prevWasSpace — был ли предыдущий записанный символ пробелом
  bool prevWasSpace = true; // начинаем с true чтобы убрать пробелы в начале

  for (int i = 0; i < chars.length; i++) {
    final isSpace = chars[i] == ' ';

    if (isSpace) {
      // Текущий символ — пробел
      // Пишем пробел только если предыдущий символ НЕ был пробелом
      // Это превращает несколько пробелов в один
      if (!prevWasSpace) {
        chars[writePos] = ' '; // записываем один пробел
        writePos++;
        prevWasSpace = true; // отмечаем что написали пробел
      }
      // Если prevWasSpace=true — пропускаем этот пробел (дубликат)
    } else {
      // Обычный символ — всегда пишем
      chars[writePos] = chars[i];
      writePos++;
      prevWasSpace = false; // предыдущий символ теперь не пробел
    }
  }

  // Убираем возможный пробел в конце (если строка заканчивалась пробелами)
  // prevWasSpace=true в конце означает что последний записанный символ — пробел
  if (writePos > 0 && prevWasSpace) {
    writePos--; // "стираем" последний пробел
  }

  // Берём только первые writePos символов — это наш результат
  return chars.sublist(0, writePos).join();
}

// ============================================================
// ВАРИАНТ через StringBuffer — читаемее, но не строго in-place
// ============================================================

String normalizeSpacesReadable(String s) {
  final result = StringBuffer(); // буфер результата
  bool prevWasSpace = true; // true = пропускаем ведущие пробелы

  for (int i = 0; i < s.length; i++) {
    if (s[i] == ' ') {
      // Добавляем пробел только если предыдущий символ не пробел
      if (!prevWasSpace) {
        result.write(' ');
        prevWasSpace = true;
      }
    } else {
      result.write(s[i]); // обычный символ — всегда добавляем
      prevWasSpace = false;
    }
  }

  // Убираем хвостовой пробел если есть
  final str = result.toString();
  return str.endsWith(' ') ? str.substring(0, str.length - 1) : str;
}
