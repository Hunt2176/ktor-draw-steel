export type ApiContext = {
    req: Request;
    pathname: string;
    method: string;
    url: URL;
    params: string[];
    namedParams: Record<string, string>;
};

type MaybeResponse = Response | null | undefined;

type RequestInterceptor = (ctx: ApiContext) => Promise<MaybeResponse> | MaybeResponse;
type MatchInterceptor = (ctx: ApiContext) => Promise<MaybeResponse> | MaybeResponse;
type ResponseInterceptor = (ctx: ApiContext, response: Response) => Promise<Response | void> | Response | void;
type ErrorInterceptor = (ctx: ApiContext, error: unknown) => Promise<MaybeResponse> | MaybeResponse;

type RouteHandler = (ctx: ApiContext) => Promise<Response> | Response;
type RouteHandlerMap = Partial<Record<string, RouteHandler>>;

export type RoutePattern = string | RegExp;

type Route = {
    method: string;
    pattern: RegExp;
    paramNames: string[];
    handler: RouteHandler;
};

function escapeRegexSegment(segment: string): string {
    return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compilePattern(pattern: RoutePattern): { regex: RegExp; paramNames: string[] } {
    if (pattern instanceof RegExp) {
        return { regex: pattern, paramNames: [] };
    }

    const normalized = pattern.startsWith("/") ? pattern : `/${pattern}`;
    if (normalized === "/") {
        return { regex: /^\/$/, paramNames: [] };
    }

    const parts = normalized.split("/").filter(Boolean);
    const paramNames: string[] = [];
    let source = "^";

    for (let index = 0; index < parts.length; index += 1) {
        const part = parts[index];
        const isLast = index === parts.length - 1;

        if (part === "*") {
            if (isLast) {
                source += "(?:/(.*))?";
            } else {
                source += "/(.*)";
            }
            paramNames.push("*");
            continue;
        }

        if (part.startsWith(":")) {
            const name = part.slice(1).trim();
            paramNames.push(name);
            source += "/([^/]+)";
            continue;
        }

        source += `/${escapeRegexSegment(part)}`;
    }

    source += "$";
    return { regex: new RegExp(source), paramNames };
}

export class ApiRouter {
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

    route(method: string, pattern: RoutePattern, handler: RouteHandler): this;
    route(pattern: RoutePattern, handlers: RouteHandlerMap): this;
    route(
        methodOrPattern: string | RoutePattern,
        patternOrHandlers: RoutePattern | RouteHandlerMap,
        handler?: RouteHandler,
    ): this {
        if (
            typeof methodOrPattern === "string"
            && (typeof patternOrHandlers === "string" || patternOrHandlers instanceof RegExp)
            && typeof handler === "function"
        ) {
            const compiled = compilePattern(patternOrHandlers);

            this.routes.push({
                method: methodOrPattern.toUpperCase(),
                pattern: compiled.regex,
                paramNames: compiled.paramNames,
                handler,
            });

            return this;
        }

        if (
            (typeof methodOrPattern === "string" || methodOrPattern instanceof RegExp)
            && typeof patternOrHandlers === "object"
            && patternOrHandlers != null
            && !(patternOrHandlers instanceof RegExp)
            && handler == null
        ) {
            for (const [method, methodHandler] of Object.entries(patternOrHandlers)) {
                if (typeof methodHandler === "function") {
                    this.route(method, methodOrPattern, methodHandler);
                }
            }

            return this;
        }

        throw new Error("Invalid route(...) arguments");
    }

    routeAll(pattern: RoutePattern, handler: RouteHandler): this {
        return this.route("*", pattern, handler);
    }

    async handle(req: Request, pathname: string): Promise<Response> {
        const ctx: ApiContext = {
            req,
            pathname,
            method: req.method.toUpperCase(),
            url: new URL(req.url),
            params: [],
            namedParams: {},
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

                const match = pathname.match(route.pattern);
                if (!match) {
                    continue;
                }

                matched = route;
                ctx.params = match.slice(1).map((value) => decodeURIComponent(value));
                ctx.namedParams = {};
                for (let index = 0; index < route.paramNames.length; index += 1) {
                    const name = route.paramNames[index];
                    const value = ctx.params[index];
                    if (name && name !== "*" && value != null) {
                        ctx.namedParams[name] = value;
                    }
                }
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
