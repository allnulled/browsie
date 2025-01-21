(async function main() {
  try {
    Data_api: {
      await Browsie.deleteDatabase("browsie_test_data");
      await Browsie.createDatabase("browsie_test_data", {
        articulos: ["!nombre", "categorias", "resumen", "fecha", "autor", "inspiracion", "tags"],
        productos: ["!nombre", "!modeloId", "categorias", "descripcion"]
      }, 2, {
        2: function(db) {
          if (!db.objectStoreNames.contains("orders")) {
            const ordersStore = db.createObjectStore("orders", {
              keyPath: "id",
              autoIncrement: true,
            });
            ordersStore.createIndex("orderDate", "orderDate", { unique: false });
            ordersStore.createIndex("userId", "userId", { unique: false });
          }
        }
      });
      const db = new Browsie("browsie_test_data");
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
      await Browsie.deleteDatabase("browsie_test_schema");
      // console.log("Create database..");
      await Browsie.createDatabase("browsie_test_schema", {
        tabla1: ["!uuid", "columna1", "columna2", "columna3"],
        tabla2: ["!uuid", "columna1", "columna2", "columna3"],
        tabla3: ["!uuid", "columna1", "columna2", "columna3"],
        tabla4: ["!uuid", "columna1", "columna2", "columna3"],
      });
      const db = await Browsie.open("browsie_test_schema");
      await db.insert("tabla1", { uuid: "1", columna1: "a", columna2: "b", columna3: "c" });
      await db.insert("tabla2", { uuid: "2", columna1: "a", columna2: "b", columna3: "c" });
      await db.insert("tabla3", { uuid: "3", columna1: "a", columna2: "b", columna3: "c" });
      await db.insert("tabla4", { uuid: "4", columna1: "a", columna2: "b", columna3: "c" });
      schema = await Browsie.getSchema("browsie_test_schema");
      console.log(schema);
      await db.close();
    }
    // await Browsie.deleteDatabase("browsie_test_data");
    // await Browsie.deleteDatabase("browsie_test_schema");
    document.querySelector("#test").textContent += "\n[✔] Browsie Schema API Tests passed successfully.";
    Triggers_api: {
      console.log(await Browsie.globMatch([
        "crud.insert.*.users",
        "crud.*.many.users"
      ], [
        "crud.select.one.users",
        "crud.select.many.users",
        "crud.insert.one.users",
        "crud.insert.many.users",
        "crud.update.one.users",
        "crud.update.many.users",
        "crud.delete.one.users",
        "crud.delete.many.users",
      ]));
      const db = await Browsie.open("browsie_test_schema");
      let counter = 0;
      await db.triggers.register("crud.insert.one.tabla1", "temp1", function() {
        console.log("triggering temp1");
        counter -= 2;
      }, {
        priority: 20
      });
      await db.triggers.register("crud.insert.one.tabla1", "temp2", function() {
        console.log("triggering temp2");
        counter *= 10;
      }, {
        priority: 10
      });
      await db.triggers.register("crud.insert.one.tabla1", "temp3", function() {
        console.log("triggering temp3");
        counter += 5;
      }, {
        priority: 30
      });
      await db.insert("tabla1", { uuid: "5", columna1: "a", columna2: "b", columna3: "c" });
      schema = await Browsie.getSchema("browsie_test_schema");
      console.log(schema);
      console.log(db);
      setTimeout(() => {
        console.log(counter);
        if(counter !== 30) {
          console.error("Failed calculus");
        } else {
          console.log("Triggers are working fine");
        }
      }, 1000);
      await db.close();
    }
    document.querySelector("#test").textContent += "\n[✔] Browsie Triggers API Tests passed successfully.";
  } catch (error) {
    console.log(error);
  }
})();