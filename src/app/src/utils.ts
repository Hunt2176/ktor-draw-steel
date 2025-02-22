export function parseIntOrUndefined(val: any): number | undefined {
	if (val == null) {
		return undefined;
	}
	
	if (typeof val === 'number' && !isNaN(val)) {
		return val;
	}
	
	const parsed = parseInt(val);
	if (isNaN(parsed)) {
		return undefined;
	}
	
	return parsed;
}

export function parseFloatOrUndefined(val: any): number | undefined {
	if (val == null) {
		return undefined;
	}
	
	if (typeof val === 'number' && !isNaN(val)) {
		return val;
	}
	
	const parsed = parseFloat(val);
	if (isNaN(parsed)) {
		return undefined;
	}
	
	return parsed;
}

export type Vararg<T> = T | T[];
export function toVararg<T>(val: Vararg<T>): T[] {
	if (Array.isArray(val)) {
		return val;
	}
	
	return [val];
}

export type TypeOrProvider<Type, ParamType = unknown> = Type | ((params: ParamType) => Type);
export function toTypeOrProvider<Type, ParamType = unknown>(val: TypeOrProvider<Type, ParamType>): (params: ParamType) => Type {
	if (typeof val === 'function') {
		return val as (params: ParamType) => Type;
	}
	
	return () => val;
}