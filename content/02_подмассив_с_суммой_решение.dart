// ============================================================
// РЕШЕНИЕ: Подотрезок с заданной суммой
// ============================================================
// Используем Prefix Sum + HashMap — работает с отрицательными числами

(int, int)? subarraySum(List<int> a, int target) {
  if (a.isEmpty) return null;

  // prefixSum[i] = сумма a[0..i-1]
  // Ключевое наблюдение:
  //   если prefixSum[j+1] - prefixSum[i] == target
  //   то подмассив a[i..j] имеет сумму target
  //
  // Переформулируем: ищем два индекса где разница prefix-сумм = target
  //   prefixSum[j+1] - target == prefixSum[i]
  //   то есть: для каждого j ищем, была ли раньше сумма (currentSum - target)

  // seen: prefix_sum → индекс (i) где эта сумма была впервые достигнута
  // Кладём (0 → -1): сумма 0 "была" до начала массива (перед индексом 0)
  // Это обрабатывает случай когда подмассив начинается с a[0]
  final seen = <int, int>{0: -1};

  int prefixSum = 0;

  for (int j = 0; j < a.length; j++) {
    // Накапливаем prefix сумму
    prefixSum += a[j];

    // Ищем: было ли раньше значение (prefixSum - target)?
    // Если да — нашли подмассив [seen[needed]+1 .. j]
    final needed = prefixSum - target;
    if (seen.containsKey(needed)) {
      return (seen[needed]! + 1, j);
    }

    // Сохраняем ТОЛЬКО первое вхождение prefix суммы
    // Первое даёт самый длинный (или самый ранний) подмассив
    if (!seen.containsKey(prefixSum)) {
      seen[prefixSum] = j;
    }
  }

  // Подмассив не найден
  return null;
}
