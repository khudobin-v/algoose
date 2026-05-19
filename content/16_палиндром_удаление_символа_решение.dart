// ============================================================
// ЗАДАЧА: Палиндром с удалением одного символа
// ============================================================
// Проверить, можно ли удалить ровно один символ из строки,
// чтобы оставшаяся строка стала палиндромом.
//
// Примеры:
//   canBePalindromeWithOneDeletion("abca")  → true  (удаляем 'b' или 'c')
//   canBePalindromeWithOneDeletion("racecar")→ true  (уже палиндром — удаляем любой)
//   canBePalindromeWithOneDeletion("abcd")  → false
//   canBePalindromeWithOneDeletion("a")     → true   (один символ — всегда палиндром)
// ============================================================

bool canBePalindromeWithOneDeletion(String s) {
  // Два указателя с обоих концов
  int left = 0;
  int right = s.length - 1;

  // Идём навстречу друг другу
  while (left < right) {
    if (s[left] != s[right]) {
      // Нашли несовпадение — пробуем пропустить один из двух символов:
      // Вариант 1: пропускаем левый символ (left+1) и проверяем остаток
      // Вариант 2: пропускаем правый символ (right-1) и проверяем остаток
      // Если хотя бы один вариант — палиндром, то ответ true
      return _isPalindrome(s, left + 1, right) ||
             _isPalindrome(s, left, right - 1);
    }
    // Символы совпали — двигаем оба указателя внутрь
    left++;
    right--;
  }

  // Дошли до середины без несовпадений — строка сама по себе палиндром
  // Удаление любого символа допустимо
  return true;
}

// Проверяет, является ли подстрока s[left..right] палиндромом
bool _isPalindrome(String s, int left, int right) {
  while (left < right) {
    if (s[left] != s[right]) return false; // нашли несовпадение — не палиндром
    left++;
    right--;
  }
  return true; // все символы совпали — палиндром
}
