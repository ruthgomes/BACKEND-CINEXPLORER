import { env } from "./config/env";
import { buildApp } from "./app";

const app = buildApp();

app.listen({
    port: env.API_PORT,
    host: '0.0.0.0'
}).then(() => {
    console.log(`Server running on http://localhost:${env.API_PORT}`)
    console.log(`Documentation available at http://localhost:${env.API_PORT}/docs`);
})