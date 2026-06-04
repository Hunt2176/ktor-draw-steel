import { useEffect, useRef } from "react";

export interface UsePreviousRefOption<T> {
	predicate?: (prev: T, next: T) => boolean;
}

export function usePreviousRef<T>(val: T, options?: UsePreviousRefOption<T>): T {
	const ref = useRef<T>(val);
	const initialized = useRef(false);
	
	useEffect(() => {
		if (initialized.current) {
			const shouldUpdate = options?.predicate?.(ref.current, val) ?? true;
			if (shouldUpdate) {
				ref.current = val;
			}
		}
		else {
			initialized.current = true;
			ref.current = val;
		}
	}, [val]);
	
	return ref.current;
}