// ============================================================
// РЕШЕНИЕ: Восстановить IP-адрес (бэктрекинг)
// ============================================================

List<String> restoreIpAddresses(String s) {
  // Быстрое отсечение: IPv4 имеет минимум 4 и максимум 12 цифр
  if (s.length < 4 || s.length > 12) return [];

  final result = <String>[];
  // parts — текущие 4 части IP которые мы собираем
  _backtrack(s, 0, [], result);
  return result;
}

void _backtrack(String s, int start, List<String> parts, List<String> result) {
  // БАЗОВЫЙ СЛУЧАЙ: набрали ровно 4 части И использовали всю строку
  if (parts.length == 4 && start == s.length) {
    result.add(parts.join('.'));
    return;
  }

  // ОТСЕЧЕНИЕ: уже 4 части, но строка не закончилась — этот путь неверный
  if (parts.length == 4) return;

  // Пробуем взять 1, 2 или 3 символа начиная с позиции start
  for (int len = 1; len <= 3; len++) {
    // Не выходим за границу строки
    if (start + len > s.length) break;

    final segment = s.substring(start, start + len);

    // Проверяем что сегмент валидный
    if (_isValid(segment)) {
      parts.add(segment);                          // делаем выбор
      _backtrack(s, start + len, parts, result);   // рекурсируем
      parts.removeLast();                          // откатываемся (backtrack!)
    }
  }
}

bool _isValid(String segment) {
  // Ведущий ноль запрещён: "01", "00", "001" — невалид (но "0" — валид)
  if (segment.length > 1 && segment[0] == '0') return false;

  // Значение должно быть от 0 до 255
  final value = int.parse(segment);
  return value >= 0 && value <= 255;
}
