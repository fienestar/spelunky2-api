export type FixedArray<T, N extends number, R extends T[] = []>
    = R['length'] extends N ? R : FixedArray<T, N, [...R, T]>;
