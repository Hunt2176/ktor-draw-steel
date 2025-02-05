import { Fragment, useId, useState } from "react";
import { Button, FormCheck, Row } from "react-bootstrap";
import { CampaignDetails, Character } from "src/types/models.ts";

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
		<Button size="sm" onClick={selectAll}>Select All</Button>
		{characters.map((c) => {
			return (
				<Fragment key={c.id}>
					<FormCheck id={`${selectorId}-${c.id}`}
				           label={c.name}
				           checked={selection[c.id] ?? false}
				           onChange={(e) => updateValue(c.id, e.target.checked)}/>
				</Fragment>
			)
		})}
	</>
}