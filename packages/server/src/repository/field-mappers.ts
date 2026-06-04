/**
 * Helpers that translate an incoming JSON body into column values, replicating
 * the original Kotlin `customizeFromJson` semantics: a field is written only
 * when its key is present and carries a value of the expected kind. Null values
 * for nullable-string fields are ignored (the original used
 * `jsonPrimitive.contentOrNull?.let { … }`, which never cleared a field).
 */
type Body = Record<string, unknown>;
type Out = Record<string, unknown>;

/** Required/plain string: set when present and a string. */
export function pickString(json: Body, key: string, out: Out, outKey = key): void {
  if (key in json && typeof json[key] === 'string') out[outKey] = json[key];
}

/** Nullable string: set only when present and a non-null string (never clears). */
export function pickNullableString(json: Body, key: string, out: Out, outKey = key): void {
  if (key in json && typeof json[key] === 'string') out[outKey] = json[key];
}

/** Integer: set when present and numeric (truncated). */
export function pickInt(json: Body, key: string, out: Out, outKey = key): void {
  if (key in json && json[key] != null) {
    const n = Number(json[key]);
    if (!Number.isNaN(n)) out[outKey] = Math.trunc(n);
  }
}

/** Integer clamped to >= 0. */
export function pickIntAtLeastZero(json: Body, key: string, out: Out, outKey = key): void {
  if (key in json && json[key] != null) {
    const n = Number(json[key]);
    if (!Number.isNaN(n)) out[outKey] = Math.max(Math.trunc(n), 0);
  }
}

/** Boolean: set when present and a boolean. */
export function pickBool(json: Body, key: string, out: Out, outKey = key): void {
  if (key in json && typeof json[key] === 'boolean') out[outKey] = json[key];
}

/** Enum string: set when present and a member of `allowed`. */
export function pickEnum<T extends string>(
  json: Body,
  key: string,
  allowed: readonly T[],
  out: Out,
  outKey = key,
): void {
  if (key in json && typeof json[key] === 'string' && allowed.includes(json[key] as T)) {
    out[outKey] = json[key];
  }
}
