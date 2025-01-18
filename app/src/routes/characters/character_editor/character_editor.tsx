import { useRef, useState } from "react";
import { Button, Form, FormLabel } from "react-bootstrap";
import { Character } from "src/types/models.ts";

export interface CharacterEditorProps {
	character: Character
	onSubmit: (character: CharacterEditorResult) => void;
}

export function CharacterEditor({ character, onSubmit }: CharacterEditorProps) {
	const stateVars = Object.entries(character)
		.reduce((eState, [key, value]) => {
			const reactProps = useState(value);
			eState[key as EditorKey] = reactProps as any;
			return eState;
		}, {} as CharacterEditorState);
	
	const changedKeys = useRef(new Set<EditorKey>());
	
	function onEdit<K extends EditorKey>(key: K, value: CharacterEditorValue<K>) {
		console.log(key, value);
		changedKeys.current.add(key);
		stateVars[key][1](value);
	}
	
	function submit() {
		const toSend = {} as CharacterEditorResult;
		for (const key of changedKeys.current) {
			toSend[key] = stateVars[key][0] as any;
		}
		
		console.log(JSON.stringify(toSend, null, 2));
		onSubmit(toSend);
	}
	
	return <>
		<Form>
			<Form.Group controlId={'char-name'}>
				<FormLabel>Name</FormLabel>
				<Form.Control
					value={stateVars['name'][0]}
					onChange={(e) => onEdit('name', e.target.value)}
				/>
			</Form.Group>
			<Form.Group controlId={'char-level'}>
				<FormLabel>Max HP</FormLabel>
				<Form.Control
					value={stateVars['maxHp'][0]}
					typeof={'number'}
					onChange={(e) => onEdit('maxHp', parseInt(e.target.value))}
				/>
			</Form.Group>
			<Form.Group controlId={'char-picture'}>
				<FormLabel>Picture</FormLabel>
				<Form.Control
					value={stateVars['pictureUrl'][0]}
					onChange={(e) => onEdit('pictureUrl', e.target.value)}
				/>
				{
					stateVars['pictureUrl'][0] ?
						<img src={stateVars['pictureUrl'][0]!} alt={stateVars['pictureUrl'][0]!}/>
						: <></>
				}
			</Form.Group>
			<Button onClick={submit}>Submit</Button>
		</Form>
	</>
}

export type CharacterEditorCore = Omit<Character, 'conditions'>
export type CharacterEditorResult = Partial<CharacterEditorCore>;
type EditorKey = keyof CharacterEditorCore;
type CharacterEditorState = {
	[K in EditorKey]: [CharacterEditorCore[K], (value: CharacterEditorCore[K] | null) => void];
}
type CharacterEditorValue<K extends EditorKey> = CharacterEditorState[K][0];