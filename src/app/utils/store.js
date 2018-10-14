
let store = null;

export function getStore() {
  return store;
}

export function setStore(newStore) {
  store = newStore;
}

export function getStoreState() {
  const store = getStore();
  if(store) {
    return store.getState();
  }
  return false;
}