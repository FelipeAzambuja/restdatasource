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
npm install restdatasource
```

## 📦 Basic Usage

```ts
import axios from "axios";
import { RestDataSource } from "restdatasource";

const api = new RestDataSource("http://localhost:3000/users", {
  axios: axios.create({ baseURL: "http://localhost:3000" }),
  bufferSize: 50,
  primaryKey: "id"
});

async function main() {
  await api.load();                // First Load 
  console.log(api.current());      // Show current row
  console.log(await api.next());   // Next
  console.log(await api.prev());   // Previous
  console.log(await api.goto(120)) // Goto to global index 128
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


