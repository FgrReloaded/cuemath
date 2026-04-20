const P = Promise as unknown as {
  try?: <T>(fn: () => T | PromiseLike<T>) => Promise<T>;
};

if (typeof P.try !== "function") {
  P.try = function <T>(fn: () => T | PromiseLike<T>): Promise<T> {
    return new Promise<T>((resolve) => resolve(fn()));
  };
}
