import { Button, Checkbox, Stack } from "@mantine/core";
import { Fragment, useId, useState } from "react";
import { Character } from "types/models.ts";
import { multiSort } from "utils.ts";

type CharacterSelection = {
	[id: number]: boolean;
}

export interface CharacterSelectorProps {
	characters: Character[];
	selected?: CharacterSelection;
	onChange?: (value: CharacterSelection) => void;
}

export function CharacterSelector({ characters, onChange, selected }: CharacterSelectorProps) {
	const selectorId = useId();
	const [selection, setSelection] = useState<Record<number, boolean>>(selected ?? {});
	
	const selectAll = () => {
		const newSelection = { ...selection };
		characters.forEach((c) => newSelection[c.id] = true);
		setSelection(newSelection);
		onChange?.(newSelection);
	};
	
	const updateValue = (id: number, value: boolean) => {
		setSelection({ ...selection, [id]: value });
		if (onChange) {
			onChange({ ...selection, [id]: value });
		}
	}
	
	return <>
		<Stack gap="sm">
			<Button size="sm" onClick={selectAll}>Select All</Button>
			{ characters.toSorted(multiSort(
				[
					{ sortBy: 'offstage', dir: 'ASC' },
					{ sortBy: 'name', dir: 'ASC' },
				])).map((c) => {
				return (
					<Checkbox key={c.id}
					          id={`${selectorId}-${c.id}`}
					          label={c.name}
					          checked={selection[c.id] ?? false}
					          onChange={(e) => updateValue(c.id, e.target.checked)}/>
				)
			})}
		</Stack>
	</>
}