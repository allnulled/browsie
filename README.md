# browsie

IndexedDB wrapper.

## Installation

Download from console:

```sh
npm i -s @allnulled/browsie
```

Import from code:

```html
<script src="node_modules/@allnulled/browsie/browsie.js"></script>
```

The global `window.Browsie` should now be available.

## API

```js
await Browsie.listDatabases()
await Browsie.deleteDatabase(dbName)
await Browsie.createDatabase(dbName, storeDefinitions)
await Browsie.getSchema(dbName)
browsie = new Browsie(dbName)
await browsie.open()
await browsie.select(store, filter)
await browsie.insert(store, item)
await browsie.update(store, id, item)
await browsie.delete(store, id)
await browsie.insertMany(store, items)
await browsie.updateMany(store, filter, item)
await browsie.deleteMany(store, filter)
```

## Example

This is the test that is ensuring the API right now:

```js
(async function main() {
  try {
    Data_api: {
      await Browsie.deleteDatabase("browsie_test");
      await Browsie.createDatabase("browsie_test", {
        articulos: ["!nombre", "categorias", "resumen", "fecha", "autor", "inspiracion", "tags"],
        productos: ["!nombre", "!modeloId", "categorias", "descripcion"]
      });
      const db = new Browsie("browsie_test");
      await db.open();
      const id1 = await db.insert("articulos", { nombre: "Artículo 1" });
      const id2 = await db.insert("articulos", { nombre: "Artículo 2" });
      const id3 = await db.insert("articulos", { nombre: "Artículo 3" });
      const selection1 = await db.select("articulos", i => i);
      if (selection1.length !== 3) {
        throw new Error("Test falló en aserción 1");
      }
      await db.update("articulos", id1, { nombre: "Artículo cambiado 1" });
      await db.update("articulos", id2, { nombre: "Artículo cambiado 2" });
      await db.update("articulos", id3, { nombre: "Artículo cambiado 3" });
      const selection2 = await db.select("articulos", i => i);
      if (selection2.length !== 3) {
        throw new Error("Test falló en aserción 2");
      }
      if (selection2[0].nombre !== "Artículo cambiado 1") {
        throw new Error("Test falló en aserción 3");
      }
      await db.delete("articulos", id3);
      await db.delete("articulos", id2);
      await db.delete("articulos", id1);
      const selection3 = await db.select("articulos", i => i);
      if (selection3.length !== 0) {
        throw new Error("Test falló en aserción 4");
      }
      await db.insertMany("articulos", [{
        nombre: "Papaguata1",
        categorias: "Papaguata, tocolombo, meketino, paquetumba, nonomuni",
        resumen: "wherever",
      }, {
        nombre: "Papaguata2",
        categorias: "Papaguata, tocolombo, meketino, paquetumba, nonomuni",
        resumen: "wherever",
      }, {
        nombre: "Papaguata3",
        categorias: "Papaguata, tocolombo, meketino, paquetumba, nonomuni",
        resumen: "wherever",
      }]);
      const selection4 = await db.select("articulos", i => i);
      if (selection4.length !== 3) {
        throw new Error("Test falló en aserción 5");
      }
      await db.close();
    }
    document.querySelector("#test").textContent += "\n[✔] Browsie Data API Tests passed successfully.";
    Schema_api: {
      // let schema = await Browsie.getSchema("browsie_test"); console.log(schema);
      await Browsie.deleteDatabase("browsie_test");
      // console.log("Create database..");
      await Browsie.createDatabase("browsie_test", {
        tabla1: ["!uuid", "columna1", "columna2", "columna3"],
        tabla2: ["!uuid", "columna1", "columna2", "columna3"],
        tabla3: ["!uuid", "columna1", "columna2", "columna3"],
        tabla4: ["!uuid", "columna1", "columna2", "columna3"],
      });
      const db = await Browsie.open("browsie_test");
      await db.insert("tabla1", { uuid: "1", columna1: "a", columna2: "b", columna3: "c" });
      await db.insert("tabla2", { uuid: "2", columna1: "a", columna2: "b", columna3: "c" });
      await db.insert("tabla3", { uuid: "3", columna1: "a", columna2: "b", columna3: "c" });
      await db.insert("tabla4", { uuid: "4", columna1: "a", columna2: "b", columna3: "c" });
      schema = await Browsie.getSchema("browsie_test");
      console.log(schema);
      await db.close();
      await Browsie.deleteDatabase("browsie_test");
    }
    document.querySelector("#test").textContent += "\n[✔] Browsie Schema API Tests passed successfully.";
  } catch (error) {
    console.log(error);
  }
})();
```

You can run it using `npm test`.

## Comments

This API avoids the versioning.

The next polyfill would be `migrateDatabase(dbName, migration)`, which should not affect the version, because the versioning in `indexeddb` is a bit shitty.