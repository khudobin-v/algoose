// ============================================================
// ЗАДАЧА: Оставить не более N повторений каждого числа
// ============================================================
// Оставить только первые N вхождений каждого числа, порядок сохранить.
//
// Примеры:
//   keepAtMost([1,1,1,2,2,3], 2) → [1,1,2,2,3]
//   keepAtMost([1,2,3,1,2,1], 2) → [1,2,3,1,2]   (последняя 1 убрана)
//   keepAtMost([1,1,1,1], 1)     → [1]
//   keepAtMost([1,2,3], 5)       → [1,2,3]
// ============================================================

List<int> keepAtMost(List<int> nums, int maxCount) {
  final result = <int>[];

  // Счётчик количества вхождений каждого числа
  final count = <int, int>{};

  for (final num in nums) {
    // Сколько раз мы уже добавили это число
    final current = count[num] ?? 0;

    if (current < maxCount) {
      // Ещё не достигли лимита — добавляем в результат
      result.add(num);
      count[num] = current + 1; // увеличиваем счётчик
    }
    // Если current >= maxCount — пропускаем (лимит исчерпан)
  }

  return result;
}

// Вариант in-place для отсортированного массива (особый случай)
// Для отсортированного массива дубликаты идут подряд — можно без HashMap
int keepAtMostSorted(List<int> nums, int maxCount) {
  // Возвращает новую длину массива (элементы перемещены in-place)
  if (nums.isEmpty) return 0;

  int writePos = 0; // позиция записи

  for (int i = 0; i < nums.length; i++) {
    // Для отсортированного массива: элемент принимается если
    // он не совпадает с элементом на maxCount позиций назад
    if (writePos < maxCount || nums[i] != nums[writePos - maxCount]) {
      nums[writePos] = nums[i];
      writePos++;
    }
  }

  return writePos; // новая длина
}
