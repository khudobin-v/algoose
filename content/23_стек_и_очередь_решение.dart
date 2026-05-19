// ============================================================
// ЗАДАЧА: Реализация стека и очереди на массивах конечного размера
// ============================================================
// Стек (LIFO — Last In First Out): push/pop/peek/isEmpty
// Очередь (FIFO — First In First Out): enqueue/dequeue/peek/isEmpty
// Массивы фиксированного размера (capacity задан в конструкторе)
// ============================================================

// ============================================================
// СТЕК на массиве
// ============================================================
class Stack<T> {
  final List<T?> _data;   // внутренний массив фиксированного размера
  final int _capacity;    // максимальная ёмкость
  int _top = -1;          // индекс верхнего элемента (-1 = пустой стек)

  Stack(this._capacity) : _data = List<T?>.filled(_capacity, null);

  // Добавляет элемент на вершину стека
  void push(T value) {
    if (isFull) throw StateError('Stack is full');
    _top++;            // сначала двигаем указатель вверх
    _data[_top] = value; // потом записываем значение
  }

  // Убирает и возвращает верхний элемент
  T pop() {
    if (isEmpty) throw StateError('Stack is empty');
    final value = _data[_top]!; // берём верхний элемент
    _data[_top] = null;          // очищаем ячейку (опционально, для GC)
    _top--;                      // уменьшаем вершину
    return value;
  }

  // Возвращает верхний элемент без удаления
  T peek() {
    if (isEmpty) throw StateError('Stack is empty');
    return _data[_top]!;
  }

  bool get isEmpty => _top == -1;          // стек пуст если top = -1
  bool get isFull => _top == _capacity - 1; // стек полон если top достиг границы
  int get size => _top + 1;               // количество элементов
}

// ============================================================
// ОЧЕРЕДЬ на массиве (кольцевой буфер)
// ============================================================
class Queue<T> {
  final List<T?> _data;  // внутренний массив
  final int _capacity;   // максимальная ёмкость
  int _head = 0;         // индекс первого элемента (для dequeue)
  int _tail = 0;         // индекс следующей свободной ячейки (для enqueue)
  int _size = 0;         // текущее количество элементов

  Queue(this._capacity) : _data = List<T?>.filled(_capacity, null);

  // Добавляет элемент в конец очереди
  void enqueue(T value) {
    if (isFull) throw StateError('Queue is full');
    _data[_tail] = value;                // записываем в позицию tail
    _tail = (_tail + 1) % _capacity;    // двигаем tail по кругу
    _size++;
  }

  // Убирает и возвращает первый элемент очереди
  T dequeue() {
    if (isEmpty) throw StateError('Queue is empty');
    final value = _data[_head]!;         // берём элемент из head
    _data[_head] = null;                 // очищаем ячейку
    _head = (_head + 1) % _capacity;    // двигаем head по кругу
    _size--;
    return value;
  }

  // Возвращает первый элемент без удаления
  T peek() {
    if (isEmpty) throw StateError('Queue is empty');
    return _data[_head]!;
  }

  bool get isEmpty => _size == 0;
  bool get isFull => _size == _capacity;
  int get size => _size;
}
