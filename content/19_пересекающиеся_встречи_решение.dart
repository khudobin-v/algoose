// ============================================================
// ЗАДАЧА: Найти пересекающиеся встречи (интервалы)
// ============================================================
// Дан список встреч (from, to). Найти все встречи, которые
// пересекаются хотя бы с одной другой встречей.
// Встречи пересекаются если у них есть общий момент времени.
//
// Примеры:
//   [(1,3),(2,4),(5,7)] → [(1,3),(2,4)]  (первые две пересекаются)
//   [(1,2),(3,4),(5,6)] → []              (никто не пересекается)
//   [(1,5),(2,3),(4,6)] → все три         (все с кем-то пересекаются)
// ============================================================

class Meeting {
  final int from; // начало встречи
  final int to;   // конец встречи

  Meeting(this.from, this.to);

  // Проверяет пересекается ли эта встреча с другой
  // Встречи пересекаются если одна начинается до окончания другой
  bool intersects(Meeting other) {
    // НЕ пересекаются если: одна заканчивается до начала другой
    // Иначе — пересекаются
    return !(to <= other.from || other.to <= from);
  }

  @override
  String toString() => '($from,$to)';
}

// Наивное решение O(n²) — для каждой пары проверяем пересечение
List<Meeting> findIntersectingMeetingsNaive(List<Meeting> meetings) {
  final result = <Meeting>{}; // Set чтобы не добавлять дубликаты

  for (int i = 0; i < meetings.length; i++) {
    for (int j = i + 1; j < meetings.length; j++) {
      if (meetings[i].intersects(meetings[j])) {
        result.add(meetings[i]); // добавляем оба пересекающихся интервала
        result.add(meetings[j]);
      }
    }
  }

  return result.toList();
}

// Оптимальное решение O(n log n) через сортировку + sweep line
List<Meeting> findIntersectingMeetings(List<Meeting> meetings) {
  if (meetings.length < 2) return []; // меньше двух — нечему пересекаться

  // Сортируем по времени начала
  final sorted = List<Meeting>.from(meetings)
    ..sort((a, b) => a.from.compareTo(b.from));

  final result = <Meeting>{}; // результат (без дубликатов)

  // Активные встречи — те, что ещё не закончились
  // Хранятся отсортированными по времени окончания
  final active = <Meeting>[];

  for (final meeting in sorted) {
    // Убираем из active встречи, закончившиеся до начала текущей
    active.removeWhere((m) => m.to <= meeting.from);

    // Все оставшиеся в active пересекаются с текущей meeting
    if (active.isNotEmpty) {
      result.addAll(active); // все активные пересекаются с текущей
      result.add(meeting);   // текущая тоже пересекается
    }

    // Добавляем текущую в список активных
    active.add(meeting);
  }

  return result.toList();
}
