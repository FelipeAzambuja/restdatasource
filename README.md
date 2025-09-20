# RestDataSource

A **TypeScript** library to consume REST APIs in a simple way, with **record buffering**, **page navigation**, and full **CRUD** support.  
Perfect when you need to handle pagination, keep a local cache of records, and control navigation between them.


---

## ✨ Features

- 🔄 **Automatic pagination** (with configurable `bufferSize`)  
- ⏩ Record navigation (`next`, `prev`, `goto`, `first`, `last`)  
- 🔍 **Search and filters** (`search`, `findBy`)  
- 📝 **Full CRUD support** (`insert`, `update`, `delete`)  
- 🔗 Custom **Axios instance** support  
- 📊 Utility methods like `dump()` for debugging  

---

## 🚀 Installation

```bash
npm install rest-data-source
```

## 📦 Basic Usage

```ts
import axios from "axios";
import { RestDataSource } from "rest-data-source";

const api = new RestDataSource("http://localhost:3000/users", {
  axios: axios.create({ baseURL: "http://localhost:3000" }),
  bufferSize: 50,
  primaryKey: "id"
});

async function main() {
  await api.load();                // Carrega primeira página
  console.log(api.current());      // Mostra o primeiro registro
  console.log(await api.next());   // Avança
  console.log(await api.prev());   // Volta
  console.log(await api.goto(120)) // Vai até índice global 120
}
main();
```

## 🔍 Search and Filters

```ts
// Pesquisa por nome
await api.findBy("name", "Felipe");

// Pesquisa com múltiplos filtros
await api.search({ status: "active", age: 30 });

```

## 📝 CRUD

```ts
// Criar
await api.insert({ name: "Novo usuário", email: "teste@mail.com" });

// Atualizar
await api.update(1, { email: "novoemail@mail.com" });

// Deletar
await api.delete(1);

```

## ⚙️ Options

| Propriedade | Tipo   | Padrão        | Descrição                              |
|-------------|--------|---------------|----------------------------------------|
| endpoint    | string | -             | API endpoint (required)      |
| axios       | Axios  | axios.create()| Custom Axios client              |
| page        | number | 1             | Initial page                         |
| bufferSize  | number | 100           | Number of records per page (buffer size)           |
| primaryKey  | string | "id"          | Primary key field in records |

## 📊 Expected Backend Response

```json
{
  "rows": [ ... ],
  "count": 999
}
```


