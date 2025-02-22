import { RefObject, useEffect, useMemo, useRef, useState } from "react";

export interface ComputedStyleHook<T extends Element> {
	ref: RefObject<T>;
	computedStyle: CSSStyleDeclaration | undefined;
}

export function useComputedStyle<T extends Element>(): ComputedStyleHook<T> {
	const ref = useRef<T>(null);
	const [computedStyle, setComputedStyle] = useState<CSSStyleDeclaration>();
	
	const hookResult = useMemo(() => ({ ref, computedStyle }), [ref, computedStyle]);
	
	useEffect(() => {
		if (ref.current) {
			setComputedStyle(window.getComputedStyle(ref.current));
		}
	}, [ref.current]);
	
	return hookResult;
}