## Upper Bound (Predecessor)

Finds the last element strictly less than the target in a sorted array.

## Important

This is NOT the same as `std::upper_bound` (which returns first element $>$ target). This returns the **predecessor** — the last element $<$ target.

## How It Works

- If $a[m] <$ target, record $m$ as candidate and search right
- Otherwise, search left
- Returns the rightmost valid position, or $-1$ if no element is smaller

## When to Use

- Finding predecessor of a value
- Last element satisfying a predicate
- Complement to lower bound for range queries

## Complexity

- Time — $O(\log n)$
- Space — $O(1)$