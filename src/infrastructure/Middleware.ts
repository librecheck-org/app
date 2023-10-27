import { FetchParams, RequestContext } from "@/apiClients";
import { useTokensStore } from "@/stores";

export class AddHeadersMiddleware {
    async pre(context: RequestContext): Promise<FetchParams | void> {
        const fetchParams = { url: context.url, init: context.init };
        const headers = new Headers(fetchParams.init.headers);

        const tokens = useTokensStore();
        await tokens.ensureIsInitialized();
        if (tokens.value !== undefined) {
            headers.set("Authorization", `Bearer ${tokens.value.accessToken}`);
        }

        fetchParams.init.headers = headers;
    }
}