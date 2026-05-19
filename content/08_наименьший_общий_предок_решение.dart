// ============================================================
// РЕШЕНИЕ: LCA с parent-указателем, O(1) памяти
// ============================================================

class TreeNode {
  int val;
  TreeNode? parent;
  TreeNode? left;
  TreeNode? right;
  TreeNode(this.val);
}

// --- РЕШЕНИЕ 1: Два указателя (элегантное, O(1) памяти) ---
//
// Аналогия: задача про пересечение двух связных списков.
// Пути от a и b до корня — два "списка" которые сходятся в LCA.
//
// Оба указателя проходят одинаковое расстояние:
//   p1: [путь от a до корня] + [путь от b до LCA]
//   p2: [путь от b до корня] + [путь от a до LCA]
// → встречаются ровно в LCA

TreeNode? lca(TreeNode? a, TreeNode? b) {
  TreeNode? p1 = a;
  TreeNode? p2 = b;

  while (p1 != p2) {
    // Если дошли до null (выше корня) — перенаправляем на старт другого узла
    // p1 прошёл весь путь от a → теперь идёт от b
    // p2 прошёл весь путь от b → теперь идёт от a
    p1 = p1 != null ? p1.parent : b;
    p2 = p2 != null ? p2.parent : a;
  }

  // p1 == p2 — это и есть LCA
  return p1;
}

// --- РЕШЕНИЕ 2: Выравнивание глубин (проще объяснять вслух) ---

int _depth(TreeNode? node) {
  int d = 0;
  // Идём вверх до корня, считаем шаги
  while (node != null) {
    node = node.parent;
    d++;
  }
  return d;
}

TreeNode? lcaByDepth(TreeNode? a, TreeNode? b) {
  int da = _depth(a);
  int db = _depth(b);

  // Поднимаем более глубокий узел до уровня второго
  // После этого оба на одной глубине
  while (da > db) {
    a = a!.parent;
    da--;
  }
  while (db > da) {
    b = b!.parent;
    db--;
  }

  // Оба на одном уровне — идём вверх вместе
  // Первое совпадение — это LCA
  while (a != b) {
    a = a!.parent;
    b = b!.parent;
  }

  return a;
}

// --- Вспомогательная функция для построения дерева в тестах ---
TreeNode buildTree() {
  final nodes = {for (var v in [3,5,1,6,2,0,8,7,4]) v: TreeNode(v)};
  void link(int parent, int? left, int? right) {
    if (left != null) {
      nodes[parent]!.left = nodes[left];
      nodes[left]!.parent = nodes[parent];
    }
    if (right != null) {
      nodes[parent]!.right = nodes[right];
      nodes[right]!.parent = nodes[parent];
    }
  }
  link(3, 5, 1);
  link(5, 6, 2);
  link(1, 0, 8);
  link(2, 7, 4);
  return nodes[3]!;
}
