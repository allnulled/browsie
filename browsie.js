(function (factory) {
  const mod = factory();
  if (typeof window !== 'undefined') {
    window["Browsie"] = mod;
  }
  if (typeof global !== 'undefined') {
    // global["Browsie"] = mod;
  }
  if (typeof module !== 'undefined') {
    // module.exports = mod;
  }
})(function () {

  class BrowsieStaticAPI {

    static openedConnections = [];

    static _trace = true;

    static trace(methodName, args = []) {
      if (this._trace) {
        console.log("[TRACE][" + methodName + "]", args.length + " args: " + Array.from(args).map(arg => typeof (arg)).join(", "));
      }
    }

    static async listDatabases() {
      this.trace("Browsie.listDatabases", arguments);
      try {
        const databases = await indexedDB.databases();
        console.log('Bases de datos disponibles:', databases);
        return databases;
      } catch (error) {
        console.error('Error al obtener las bases de datos:', error);
      }
    }

    // Crea la base de datos con el esquema final
    static createDatabase(dbName, storeDefinitions) {
      this.trace("Browsie.createDatabase", arguments);
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => {
          request.result.close();
          resolve(request.result);
        };
        request.onerror = (error) => reject(error);

        // Establecemos el esquema final
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const storeKeys = Object.keys(storeDefinitions);
          storeKeys.forEach(storeKey => {
            const store = storeDefinitions[storeKey];
            if (!db.objectStoreNames.contains(storeKey)) {
              const objectStore = db.createObjectStore(storeKey, {
                keyPath: "id",
                autoIncrement: true,
              });
              for (let storeIndex of store) {
                const storeName = storeIndex.replace(/^\!/g, "");
                objectStore.createIndex(storeName, storeName, {
                  unique: storeIndex.startsWith("!")
                });
              }
            }
          });
        };
      });
    }

    // Obtener todos los datos de un store
    static async getAllDataFromStore(dbName, storeName) {
      this.trace("Browsie.getAllDataFromStore", arguments);
      return await new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);

        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);

          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => resolve(getAllRequest.result);
          getAllRequest.onerror = () => {
            db.close();
            reject(new Error('Error al obtener los datos del store'));
          };
        };

        request.onerror = () => {
          reject(new Error('Error al abrir la base de datos'));
        };
      });
    }

    // Insertar datos en un store
    static async insertDataIntoStore(dbName, storeName, data) {
      this.trace("Browsie.insertDataIntoStore", arguments);
      return await new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);

        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);

          data.forEach(item => store.add(item));

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => {
            db.close();
            reject(new Error('Error al insertar los datos en el store'));
          };
        };

        request.onerror = () => {
          reject(new Error('Error al abrir la base de datos'));
        };
      });
    }

    // Eliminar una base de datos
    static deleteDatabase(dbName) {
      this.trace("Browsie.deleteDatabase", arguments);
      return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);

        request.onblocked = () => {
          db.close();
          reject(new Error("Error al eliminar la base de datos porque está bloqueada"));
        };
        request.onsuccess = () => resolve();
        request.onerror = () => {
          db.close();
          reject(new Error('Error al eliminar la base de datos'));
        };
      });
    }

    static async getSchema(dbName) {
      this.trace("Browsie.getSchema", arguments);
      let db = undefined;
      try {
        // Abrir la base de datos en modo solo lectura
        const request = indexedDB.open(dbName);

        db = await new Promise((resolve, reject) => {
          request.onsuccess = (event) => resolve(event.target.result);
          request.onerror = () => {
            reject(new Error('Error al abrir la base de datos'));
          };
        });

        // Construir el esquema a partir de los almacenes
        const schema = {};
        const objectStoreNames = Array.from(db.objectStoreNames); // Lista de stores

        objectStoreNames.forEach(storeName => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);

          const storeInfo = {
            keyPath: store.keyPath,
            autoIncrement: store.autoIncrement,
            indexes: []
          };

          // Recorrer los índices del store
          const indexNames = Array.from(store.indexNames); // Lista de índices
          indexNames.forEach(indexName => {
            const index = store.index(indexName);
            storeInfo.indexes.push({
              name: index.name,
              keyPath: index.keyPath,
              unique: index.unique,
              multiEntry: index.multiEntry
            });
          });

          schema[storeName] = storeInfo;
        });

        return schema;
      } catch (error) {
        console.error('Error al obtener el esquema:', error);
        throw error;
      } finally {
        if (db) {
          db.close();
        }
      }
    }

  }


  class Browsie extends BrowsieStaticAPI {

    static async open(...args) {
      this.trace("Browsie.open", arguments);
      const db = new this(...args);
      await db.open();
      return db;
    }

    // Constructor que abre la base de datos
    constructor(dbName, trace = false) {
      super();
      this.dbName = dbName;
      this.db = null;
      this._trace = trace;
    }

    // Abre la base de datos
    open() {
      this.constructor.trace("browsie.open", arguments);
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName);

        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };
        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.open» operation over database «${this.dbName}»: `));
      });
    }

    close(...args) {
      this.constructor.trace("browsie.close", arguments);
      return this.db.close(...args);
    }

    // Método para seleccionar elementos de un store con un filtro
    select(store, filter) {
      this.constructor.trace("browsie.select", arguments);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readonly');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.getAll();

        request.onsuccess = () => {
          const result = request.result.filter(item => {
            return Object.keys(filter).every(key => item[key] === filter[key]);
          });
          resolve(result);
        };
        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.select» operation over store «${store}»: `));
      });
    }

    // Método para insertar un solo item en un store
    insert(store, item) {
      this.constructor.trace("browsie.insert", arguments);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.add(item);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.insert» operation over store «${store}»: `));
      });
    }

    // Método para actualizar un item en un store
    update(store, id, item) {
      this.constructor.trace("browsie.update", arguments);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.put({ ...item, id });

        request.onsuccess = () => resolve(request.result);
        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.update» operation over store «${store}»: `));
      });
    }

    // Método para eliminar un item de un store por ID
    delete(store, id) {
      this.constructor.trace("browsie.delete", arguments);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.delete» operation over store «${store}»: `));
      });
    }

    _expandError(errorObject, baseMessage = false) {
      this.constructor.trace("browsie._expandError", arguments);
      let error = errorObject;
      if (errorObject instanceof Error) {
        error = errorObject;
      } else if (errorObject.target && errorObject.target.error) {
        error = errorObject.target.error;
      } else {
        error = new Error(errorObject);
      }
      if (baseMessage) {
        const errorTemp = new Error(error.message ?? error);
        Object.assign(errorTemp, error);
        errorTemp.message = baseMessage + errorTemp.message;
        error = errorTemp;
      }
      return error;
    }

    // Método para insertar varios items en un store
    insertMany(store, items) {
      this.constructor.trace("browsie.insertMany", arguments);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        let insertedCount = 0;

        items.forEach(item => {
          const request = objectStore.add(item);
          request.onsuccess = () => {
            insertedCount++;
            if (insertedCount === items.length) resolve();
          };
          request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.insertMany» operation over store «${store}» inserting «${items.length}» items: `));
        });
      });
    }

    // Método para actualizar varios items en un store
    updateMany(store, filter, item) {
      this.constructor.trace("browsie.updateMany", arguments);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.openCursor();
        let updatedCount = 0;
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            if (Object.keys(filter).every(key => cursor.value[key] === filter[key])) {
              const updatedItem = { ...cursor.value, ...item };
              const updateRequest = cursor.update(updatedItem);
              updateRequest.onsuccess = () => {
                updatedCount++;
                if (updatedCount === cursor.value.length) resolve();
              };
            }
            cursor.continue();
          }
        };

        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.updateMany» operation over store «${store}»: `));
      });
    }

    // Método para eliminar varios items de un store según un filtro
    deleteMany(store, filter) {
      this.constructor.trace("browsie.deleteMany", arguments);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.openCursor();

        let deletedCount = 0;
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            if (Object.keys(filter).every(key => cursor.value[key] === filter[key])) {
              const deleteRequest = cursor.delete();
              deleteRequest.onsuccess = () => {
                deletedCount++;
                if (deletedCount === cursor.value.length) resolve();
              };
            }
            cursor.continue();
          }
        };

        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.deleteMany» operation over store «${store}»: `));
      });
    }
  }

  Browsie.default = Browsie;

  return Browsie;

});