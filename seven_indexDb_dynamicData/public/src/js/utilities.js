var dbPromise = idb.open("posts-store", 1, function (db) {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }
});

function writeData(st, data) {
  return dbPromise.then((db) => {
    var tx = db.transaction(st, "readwrite");
    // then we explicitly have to open the store. Now that we got access to the opened store, we can use that and
    // put something.
    var store = tx.objectStore(st);
    store.put(data);
    // and now we can close the transaction by returning tx complete.
    // It's not a method,
    // it's just a property
    // and this simply makes sure that this transaction gets executed, that the put operation gets done
    return tx.complete;
  });
}

function readAllData(st) {
  return dbPromise.then((db) => {
    var tx = db.transaction(st, "readonly");
    var store = tx.objectStore(st);
    return store.getAll();
  });
}

function clearAllData(st) {
  return dbPromise.then((db) => {
    var tx = db.transaction(st, "readwrite");
    var store = tx.objectStore(st);
    store.clear();
    return tx.complete;
  });
}

function deleteItemFromData(st, id) {
  return dbPromise
    .then((db) => {
      var tx = db.transaction(st, "readwrite");
      var store = tx.objectStore(st);
      store.delete(id);
      return tx.complete;
    })
    .then((res) => {
      console.log("Item deleted", res, id);
    });
}
