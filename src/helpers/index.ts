import { Configuration, DefaultConfig } from "@/apiClients";
import { AddHeadersMiddleware } from "@/infrastructure";

export async function initDefaultApiConfig() {
    const env = await (await fetch("/env.json")).json();

    DefaultConfig.config = new Configuration({
        basePath: env?.API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL,
        middleware: [new AddHeadersMiddleware()]
    });
}
