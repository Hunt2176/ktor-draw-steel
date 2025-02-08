import './character_editor.scss';

import { useRef, useState } from "react";
import { Button, Col, Form, FormLabel, Image, Row } from "react-bootstrap";
import { UploadModal } from "src/components/upload-modal.tsx";
import { usePromise } from "src/hooks/promise_hook.ts";
import { Character } from "src/types/models.ts";

export interface CharacterEditorProps {
	character: Character
	onSubmit: (character: CharacterEditorResult) => void | Promise<void>;
}

export function CharacterEditor({ character, onSubmit }: CharacterEditorProps) {
	const [submitPromise, setSubmitPromise] = useState<Promise<void>>();
	const [showUploadFile, setShowUploadFile] = useState(false);
	
	const stateVars = Object.entries(character)
		.reduce((eState, [key, value]) => {
			const reactProps = useState(value);
			eState[key as EditorKey] = reactProps as any;
			return eState;
		}, {} as CharacterEditorState);
	
	const changedKeys = useRef(new Set<EditorKey>());
	
	//TODO: Move to using query mutations
	const { loading: submitLoading } = usePromise(submitPromise);
	
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
			<Form.Group controlId={'char-' + key}>
				<FormLabel>{key[0].toUpperCase() + key.slice(1)}</FormLabel>
				<Form.Control
					value={wrapNumberValue(stateVars[key][0])}
					type={'number'}
					onChange={(e) => onEdit(key, parseInt(e.target.value))}
				/>
			</Form.Group>
		);
	}
	
	return <>
		<UploadModal show={showUploadFile}
		             accept=".png,.jpg,.jpeg,.webp"
		             onHide={() => setShowUploadFile(false)}
		             onComplete={(e) => {
			             onEdit('pictureUrl', `/files/${e}`);
			             setShowUploadFile(false);
		             }}>
			{(file) => {
				if (file == null) {
					return <></>;
				}
				
				return <Image thumbnail className="modal-image" src={URL.createObjectURL(file)}/>
			}}
		</UploadModal>
		<Form>
			<Form.Group controlId={'char-name'}>
				<FormLabel>Name</FormLabel>
				<Form.Control
					value={stateVars['name'][0]}
					maxLength={100}
					onChange={(e) => onEdit('name', e.target.value)}
				/>
			</Form.Group>
			<Row>
				<Col>
					{createStateBlock('might')}
				</Col>
				<Col>
					{createStateBlock('agility')}
				</Col>
				<Col>
					{createStateBlock('intuition')}
				</Col>
				<Col>
					{createStateBlock('presence')}
				</Col>
				<Col>
					{createStateBlock('reason')}
				</Col>
			</Row>
			<Form.Group controlId={'char-hp'}>
				<FormLabel>Max HP</FormLabel>
				<Form.Control
					value={stateVars['maxHp'][0]}
					typeof={'number'}
					min={0}
					onChange={(e) => onEdit('maxHp', parseInt(e.target.value))}
				/>
			</Form.Group>
			<Form.Group controlId={'char-recoveries'}>
				<FormLabel>Recoveries</FormLabel>
				<Form.Control
					value={stateVars['maxRecoveries'][0]}
					typeof={'number'}
					min={0}
					onChange={(e) => onEdit('maxRecoveries', parseInt(e.target.value))}
				/>
			</Form.Group>
			<Form.Group controlId={'char-picture'}>
				<FormLabel>Picture</FormLabel>
				<Row>
					<Col xs={9}>
						<Form.Control
							value={stateVars['pictureUrl'][0] ?? undefined}
							onChange={(e) => onEdit('pictureUrl', e.target.value)}
						/>
					</Col>
					<Col xs={3} className="d-flex justify-content-center">
						<Button onClick={() => setShowUploadFile(true)}>Upload</Button>
					</Col>
				</Row>
				{
					stateVars['pictureUrl'][0] ?
						<img style={{maxWidth: '100%', objectFit: 'contain'}} src={stateVars['pictureUrl'][0]!} alt={stateVars['pictureUrl'][0]!}/>
						: <></>
				}
			</Form.Group>
			<Row style={{justifyContent: 'end', paddingTop: '10px'}}>
				<Col sm={4} style={{textAlign: 'right'}}>
					<Button disabled={submitLoading} onClick={submit}>Submit</Button>
				</Col>
			</Row>
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