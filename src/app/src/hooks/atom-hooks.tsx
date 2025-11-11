import { Atom, atom } from 'jotai';
import { atomFamily } from "jotai/utils";
import { useEffect, useMemo, useRef } from "react";
import { AtomFamily, BasicWritableAtom } from "types/atom_types.ts";
import { Comparer } from "types/types.ts";

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

export function useAtomFamily<FN extends (...args: any[]) => Atom<any>>(init: FN, comparer?: Comparer<Parameters<FN>>): AtomFamily<Parameters<FN>, ReturnType<FN>> {
	const familyRef = useRef<AtomFamily<Parameters<FN>, ReturnType<FN>>>()
	
	useEffect(() => {
		const family = atomFamily((args: Parameters<FN>) => {
			return init(...args);
		}, comparer);
		
		familyRef.current = family as any;
		
		return () => {
			const all = family.getParams();
			for (const param of all) {
				family.remove(param);
			}
		}
	}, []);
	
	return familyRef.current!;
}