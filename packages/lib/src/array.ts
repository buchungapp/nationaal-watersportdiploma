type FindItemReturnType<T, Enforce extends boolean> = Enforce extends true
  ? NonNullable<T>
  : T | undefined;

export function findItem<T, Enforce extends boolean = false>({
  items,
  predicate,
  enforce = false as Enforce,
}: {
  items: T[] | undefined;
  predicate: (item: T) => boolean;
  enforce?: Enforce;
}): FindItemReturnType<T, Enforce> {
  if (!items) {
    if (enforce) {
      throw new Error("Array is undefined, enforcement fails.");
    }
    return undefined as FindItemReturnType<T, Enforce>;
  }

  const item = items.find(predicate);

  if (!item && enforce) {
    throw new Error("Item not found with the provided predicate.");
  }

  return item as FindItemReturnType<T, Enforce>;
}
