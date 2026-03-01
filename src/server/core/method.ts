export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD", "*"] as const;

export type Method = (typeof HTTP_METHODS)[number];
export type RequestMethod = Exclude<Method, "*">;

export function isMethod(value: string): value is Method {
    return HTTP_METHODS.includes(value as Method);
}

export function isRequestMethod(value: string): value is RequestMethod {
    return value !== "*" && isMethod(value);
}
