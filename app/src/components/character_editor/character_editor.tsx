import { NumberInput, Image, Stack, TextInput, Group, Button, Divider, Loader } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRef, useState } from "react";
import { UploadModal } from "src/components/upload-modal.tsx";
import { usePromise } from "src/hooks/promise_hook.ts";
import { Character } from "src/types/models.ts";
import { parseIntOrUndefined } from "src/utils.ts";

export interface CharacterEditorProps {
	character: Character
	onSubmit: (character: CharacterEditorResult) => void | Promise<void>;
	uploadStackId?: string
}

export function CharacterEditor({ uploadStackId, character, onSubmit }: CharacterEditorProps) {
	const [submitPromise, setSubmitPromise] = useState<Promise<void>>();
	const [showUploadFile, showFileUploadHandler] = useDisclosure(false);
	
	const stateVars = Object.entries(character)
		.reduce((eState, [key, value]) => {
			const reactProps = useState(value);
			eState[key as EditorKey] = reactProps as any;
			return eState;
		}, {} as CharacterEditorState);
	
	const changedKeys = useRef(new Set<EditorKey>());
	
	const { loading: submitLoading } = usePromise(submitPromise);
	
	function onEdit<K extends EditorKey>(key: K, value: CharacterEditorValue<K>) {
		if (isNaN(value as any)) {
			(value as any) = null;
		}
		
		console.log(key, value);
		changedKeys.current.add(key);
		stateVars[key][1](value ?? null);
	}
	
	function submit() {
		const toSend = {} as CharacterEditorResult;
		for (const key of changedKeys.current) {
			toSend[key] = stateVars[key][0] as any;
		}
		
		console.log(JSON.stringify(toSend, null, 2));
		const res = onSubmit(toSend);
		if (res instanceof Promise) {
			setSubmitPromise(res);
		}
	}
	
	function wrapNumberValue(val: any): number | string {
		if (typeof val !== 'number') {
			return '';
		}
		else if (isNaN(val)) {
			return '';
		}
		
		return val;
	}
	
	function createStateBlock(key: keyof Pick<CharacterEditorCore, 'might' | 'agility' | 'intuition' | 'presence' | 'reason'>) {
		return (
			<NumberInput label={key[0].toUpperCase() + key.slice(1)}
			             value={wrapNumberValue(stateVars[key][0])}
			             onChange={(e) => onEdit(key, parseIntOrUndefined(e) ?? NaN)}/>
		);
	}
	
	return <>
		<UploadModal stackId={uploadStackId}
		             show={showUploadFile}
		             accept=".png,.jpg,.jpeg,.webp"
		             onHide={showFileUploadHandler.close}
		             onComplete={(e) => {
			             onEdit('pictureUrl', `/files/${e}`);
			             showFileUploadHandler.close();
		             }}>
			{(file) => {
				if (file == null) {
					return <></>;
				}
				
				return <Image src={URL.createObjectURL(file)}/>
			}}
		</UploadModal>
		<Stack>
			<TextInput label="Name"
			           value={stateVars['name'][0]}
			           onChange={(e) => onEdit('name', e.target.value)}/>
			<Group>
				{createStateBlock('might')}
				{createStateBlock('agility')}
				{createStateBlock('reason')}
				{createStateBlock('intuition')}
				{createStateBlock('presence')}
			</Group>
			
			<NumberInput label="Max HP"
			             value={wrapNumberValue(stateVars['maxHp'][0])}
			             onChange={(e) => onEdit('maxHp', parseIntOrUndefined(e) ?? NaN)}/>
			
			<NumberInput label="Recoveries"
			             value={wrapNumberValue(stateVars['maxRecoveries'][0])}
			             onChange={(e) => onEdit('maxRecoveries', parseIntOrUndefined(e) ?? NaN)}/>
			
			<Divider/>
			{ stateVars['pictureUrl'][0] &&
				<Image src={stateVars['pictureUrl'][0]}></Image>
			}
			<Stack>
				<TextInput label="Picture URL"
				           value={stateVars['pictureUrl'][0] ?? ''}
				           onChange={(e) => onEdit('pictureUrl', e.target.value)}/>
				<Button onClick={showFileUploadHandler.open}>Upload</Button>
			</Stack>
			<Divider my={'md'} />
			<Group justify="end">
				<Button disabled={submitLoading}
				        onClick={submit}
				        leftSection={
					        submitLoading && <Loader/>
				        }>
					Submit
				</Button>
			</Group>
		</Stack>
	</>
}

export type CharacterEditorCore = Omit<Character, 'conditions'>
export type CharacterEditorResult = Partial<CharacterEditorCore>;
type EditorKey = keyof CharacterEditorCore;
type CharacterEditorState = {
	[K in EditorKey]: [CharacterEditorCore[K], (value: CharacterEditorCore[K] | null) => void];
}
type CharacterEditorValue<K extends EditorKey> = CharacterEditorState[K][0];