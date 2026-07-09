const db = { find: (id: number) => ({ id }) };

export function getUser(id: number) {
  return db.find(id);
}

export function run() {
  return getUser(1);
}
