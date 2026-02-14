import { Button, NumberInput, Stack } from "@mantine/core";
import { useNumericAtom } from "hooks/atom-hooks.tsx";
import { atom, useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";
import { ModifyRequest } from "services/api.ts";

export const ValueModifierChangeType = Object.freeze({
	INCREASE: 'INCREASE',
	DECREASE: 'DECREASE'
} as const);

export type ValueModifierChangeType = typeof ValueModifierChangeType[keyof typeof ValueModifierChangeType];

export interface ValueModifierChangeEvent extends ModifyRequest {
	type: ValueModifierChangeType
	modifyBy: number
}
export interface ValueModifierProps {
	onChange: (ev: ValueModifierChangeEvent) => void;
	label?: string;
	initialValue?: number;
	increaseLabel?: string;
	decreaseLabel?: string;
}

export function ValueModifier(props: ValueModifierProps) {
	const internalAtom = useNumericAtom(props.initialValue ?? 0);
	const [display, setDisplay] = useAtom(internalAtom);
	
	const output = useAtomValue(useMemo(() => {
		return atom((get) => {
			const val = get(internalAtom);
			if (val === 0) {
				return '';
			}
			return val;
		})
	}, []))
	
	const execute = useCallback((action: ValueModifierChangeType) => {
		props.onChange({
			type: action,
			modifyBy: display
		});
		
		setDisplay(0);
	}, [props.onChange, display, setDisplay]);
	
	return (<>
		<Stack>
			<Stack>
				<NumberInput label={props.label}
				             value={output}
				             min={0}
				             autoFocus
				             onChange={setDisplay}/>
				<Button.Group>
					<Button onClick={() => execute(ValueModifierChangeType.INCREASE)} color={'green'}>
						{ props.increaseLabel ?? 'Increase' }
					</Button>
					<Button onClick={() => execute(ValueModifierChangeType.DECREASE)} color={'red'}>
						{ props.decreaseLabel ?? 'Decrease' }
					</Button>
				</Button.Group>
			</Stack>
		</Stack>
	</>)
}