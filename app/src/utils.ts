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