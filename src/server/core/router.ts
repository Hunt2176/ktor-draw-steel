export type RequestRouterContext = {
    req: Request;
    pathname: string;
    method: string;
    url: URL;
    params: string[];
    server: Bun.Server<unknown> | null;
};

type MaybeResponse = Response | null | undefined;

type RequestInterceptor = (ctx: RequestRouterContext) => Promise<MaybeResponse> | MaybeResponse;
type MatchInterceptor = (ctx: RequestRouterContext) => Promise<MaybeResponse> | MaybeResponse;
type ResponseInterceptor =
    (ctx: RequestRouterContext, response: Response) => Promise<Response | void> | Response | void;
type ErrorInterceptor = (ctx: RequestRouterContext, error: unknown) => Promise<MaybeResponse> | MaybeResponse;

type RouteHandler = (ctx: RequestRouterContext) => Promise<Response> | Response;

type Route = {
    method: string;
    pattern: RegExp;
    handler: RouteHandler;
};

export class RequestRouter {
    private requestInterceptors: RequestInterceptor[] = [];
    private matchInterceptors: MatchInterceptor[] = [];
    private responseInterceptors: ResponseInterceptor[] = [];
    private errorInterceptors: ErrorInterceptor[] = [];
    private routes: Route[] = [];

    interceptRequest(interceptor: RequestInterceptor): this {
        this.requestInterceptors.push(interceptor);
        return this;
    }

    interceptMatch(interceptor: MatchInterceptor): this {
        this.matchInterceptors.push(interceptor);
        return this;
    }

    interceptResponse(interceptor: ResponseInterceptor): this {
        this.responseInterceptors.push(interceptor);
        return this;
    }

    interceptError(interceptor: ErrorInterceptor): this {
        this.errorInterceptors.push(interceptor);
        return this;
    }

    route(method: string, pattern: RegExp, handler: RouteHandler): this {
        this.routes.push({
            method: method.toUpperCase(),
            pattern,
            handler,
        });

        return this;
    }

    routeAll(pattern: RegExp, handler: RouteHandler): this {
        return this.route("*", pattern, handler);
    }

    async handle(req: Request, server: Bun.Server<unknown> | null = null): Promise<Response> {
        const url = new URL(req.url);
        const ctx: RequestRouterContext = {
            req,
            pathname: url.pathname,
            method: req.method.toUpperCase(),
            url,
            params: [],
            server,
        };

        try {
            for (const interceptor of this.requestInterceptors) {
                const early = await interceptor(ctx);
                if (early instanceof Response) {
                    return early;
                }
            }

            let matched: Route | undefined;
            for (const route of this.routes) {
                if (route.method !== "*" && route.method !== ctx.method) {
                    continue;
                }

                const match = ctx.pathname.match(route.pattern);
                if (!match) {
                    continue;
                }

                matched = route;
                ctx.params = match.slice(1);
                break;
            }

            if (!matched) {
                return new Response("Not found", { status: 404 });
            }

            for (const interceptor of this.matchInterceptors) {
                const early = await interceptor(ctx);
                if (early instanceof Response) {
                    return early;
                }
            }

            let response = await matched.handler(ctx);

            for (const interceptor of this.responseInterceptors) {
                const maybeResponse = await interceptor(ctx, response);
                if (maybeResponse instanceof Response) {
                    response = maybeResponse;
                }
            }

            return response;
        } catch (error) {
            for (const interceptor of this.errorInterceptors) {
                const handled = await interceptor(ctx, error);
                if (handled instanceof Response) {
                    return handled;
                }
            }

            throw error;
        }
    }
}
