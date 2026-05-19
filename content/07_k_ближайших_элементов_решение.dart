// ============================================================
// РЕШЕНИЕ: K ближайших элементов в отсортированном массиве
// ============================================================

List<int> findKClosest(List<int> a, int index, int k) {
  // Опорный элемент — расстояние 0, всегда входит в ответ
  final target = a[index];
  final result = <int>[target];

  // Два указателя расходятся от index в обе стороны
  int left = index - 1;  // кандидат слева
  int right = index + 1; // кандидат справа

  // Набираем k элементов (один уже есть — target)
  while (result.length < k) {
    // Расстояние от левого кандидата до target
    // Если left вышел за границу — расстояние бесконечность (берём правый)
    final leftDist = left >= 0
        ? (a[left] - target).abs()
        : double.maxFinite;

    // Расстояние от правого кандидата до target
    // Если right вышел за границу — расстояние бесконечность (берём левый)
    final rightDist = right < a.length
        ? (a[right] - target).abs()
        : double.maxFinite;

    // Берём ближайшего. При ничьей (leftDist == rightDist) берём левого
    // Это соответствует условию "предпочитать меньший элемент"
    if (leftDist <= rightDist) {
      result.add(a[left]);
      left--;  // двигаем левый указатель внутрь
    } else {
      result.add(a[right]);
      right++; // двигаем правый указатель внутрь
    }
  }

  return result;
}
