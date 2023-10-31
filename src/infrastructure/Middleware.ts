import { FetchParams, RequestContext } from "@/apiClients";
import { StorageKey, Tokens } from "@/models";
import { readFromStorage } from "./Storage";

export class AddHeadersMiddleware {
    async pre(context: RequestContext): Promise<FetchParams | void> {
        const fetchParams = { url: context.url, init: context.init };
        const headers = new Headers(fetchParams.init.headers);

        const tokens = await readFromStorage<Tokens>(StorageKey.Tokens);
        if (tokens !== undefined) {
            headers.set("Authorization", `Bearer ${tokens.accessToken}`);
        }

        fetchParams.init.headers = headers;
    }
}