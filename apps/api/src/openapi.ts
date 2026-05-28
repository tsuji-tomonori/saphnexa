import { app } from "./app";

const response = await app.request("/openapi.json");
console.log(JSON.stringify(await response.json(), null, 2));
