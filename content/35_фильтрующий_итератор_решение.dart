// ============================================================
// ЗАДАЧА: Фильтрующий итератор
// ============================================================
// Реализовать итератор который возвращает только чётные числа
// из входного потока/коллекции.
//
// Интерфейс:
//   hasNext() → bool  — есть ли следующее чётное число
//   next()    → int   — вернуть следующее чётное число
//
// Примеры:
//   iter([1,2,3,4,5,6]): next()→2, next()→4, next()→6, hasNext()→false
//   iter([1,3,5]):        hasNext()→false
// ============================================================

class EvenIterator {
  final Iterator<int> _source; // исходный итератор
  int? _nextEven;              // следующее чётное число (null = не найдено)

  EvenIterator(Iterable<int> source) : _source = source.iterator {
    // Инициализируем: находим первое чётное число
    _advance();
  }

  // Ищет следующее чётное число в исходном потоке
  void _advance() {
    _nextEven = null; // сбрасываем — предполагаем что не найдём
    while (_source.moveNext()) {
      if (_source.current % 2 == 0) {
        _nextEven = _source.current; // нашли чётное — сохраняем
        return; // прекращаем поиск до следующего вызова
      }
      // Нечётное — продолжаем искать
    }
    // Исчерпали источник — _nextEven остался null
  }

  // Проверяет, есть ли ещё чётные числа
  bool hasNext() => _nextEven != null;

  // Возвращает следующее чётное число
  int next() {
    if (!hasNext()) throw StateError('No more even numbers');
    final value = _nextEven!; // берём сохранённое значение
    _advance();                // находим следующее чётное
    return value;
  }
}

// Обобщённый вариант — фильтрующий итератор с произвольным предикатом
class FilterIterator<T> {
  final Iterator<T> _source;
  final bool Function(T) _predicate; // условие фильтрации
  T? _next;                          // следующий подходящий элемент
  bool _hasNext = false;             // флаг наличия следующего

  FilterIterator(Iterable<T> source, this._predicate)
      : _source = source.iterator {
    _advance();
  }

  void _advance() {
    _hasNext = false;
    while (_source.moveNext()) {
      if (_predicate(_source.current)) {
        _next = _source.current;
        _hasNext = true;
        return;
      }
    }
  }

  bool hasNext() => _hasNext;

  T next() {
    if (!hasNext()) throw StateError('No more elements');
    final value = _next as T;
    _advance();
    return value;
  }
}
