const store = new Map();

module.exports = {
  setItemAsync: async (key, value) => {
    store.set(key, value);
  },
  getItemAsync: async (key) => {
    return store.get(key) || null;
  },
  deleteItemAsync: async (key) => {
    store.delete(key);
  },
  __clearMockStore: () => {
    store.clear();
  },
};
