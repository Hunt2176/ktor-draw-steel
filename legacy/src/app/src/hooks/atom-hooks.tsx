import { atom } from 'jotai';
import { useMemo } from "react";
import { BasicWritableAtom } from "types/atom_types.ts";

export function useNumericAtom(initialValue: BasicWritableAtom<number> | number) {
	return useMemo(() => {
		let valueAtom: BasicWritableAtom<number>;
		if (typeof initialValue === 'number') {
			valueAtom = atom(initialValue);
		} else {
			valueAtom = initialValue;
		}
		
		return atom(
			(get) => {
				return get(valueAtom);
			},
			(_get, set, value: number | string) => {
				if (typeof value === 'number') {
					set(valueAtom, value);
					return;
				}
				
				let parsed = parseFloat(value);
				if (isNaN(parsed)) {
					if (value.trim().length === 0) {
						parsed = 0;
					}
					else {
						return;
					}
				}
				
				const isWholeNumber = Number.isInteger(parsed);
				if (isWholeNumber) {
					parsed = Math.floor(parsed);
				}
				
				set(valueAtom, parsed);
			});
		
	}, [initialValue]);
}