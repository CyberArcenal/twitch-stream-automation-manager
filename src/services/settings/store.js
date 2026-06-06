// src/main/services/settings/store.js
const Store = require("electron-store");
const { defaults } = require("./defaults");

let storeInstance = null;

function getStore() {
  if (!storeInstance) {
    storeInstance = new Store({ defaults });
  }
  return storeInstance;
}

module.exports = { getStore };