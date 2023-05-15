export async function mapLimit<T, R>(
  arr: T[],
  fn: (x: T, i: number) => Promise<R>,
  limit = 10
): Promise<R[]> {
  if (limit < 1) {
    throw new Error('limit must be >= 1');
  }
  const results: R[] = [];
  await Promise.all(
    arr.slice(0, limit).map(async (x, i) => {
      results[i] = await fn(x, i);
      while (true) {
        const next = limit++;
        if (next >= arr.length) {
          break;
        }
        results[next] = await fn(arr[next], next);
      }
    })
  );
  return results;
}
