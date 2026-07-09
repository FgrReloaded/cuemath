const db = { find: (id: number) => ({ id }) };

export function fetchUser(id: number) {
  return db.find(id);
}

export function run() {
  return fetchUser(1);
}
