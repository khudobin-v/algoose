// ============================================================
// ЗАДАЧА: Максимальное число подряд идущих единиц
// ============================================================
// Дан массив из 0 и 1. Найти максимальное число единиц подряд.
//
// Примеры:
//   maxConsecutiveOnes([1,1,0,1,1,1]) → 3
//   maxConsecutiveOnes([1,0,1,1,0,1]) → 2
//   maxConsecutiveOnes([0,0,0])        → 0
//   maxConsecutiveOnes([1,1,1])        → 3
// ============================================================

int maxConsecutiveOnes(List<int> nums) {
  int maxCount = 0; // лучший результат
  int current = 0;  // длина текущей серии единиц

  for (final x in nums) {
    if (x == 1) {
      current++;
      if (current > maxCount) maxCount = current;
    } else {
      current = 0;
    }
  }

  return maxCount;
}
