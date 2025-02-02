import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useMemo, useRef, useState } from "react";
import { Button, ButtonGroup, Card, CloseButton, Col, FormControl, FormGroup, FormLabel, Modal, Overlay, Popover, PopoverBody, PopoverHeader, ProgressBar, Row, Table } from "react-bootstrap";
import { CharacterEditor, CharacterEditorCore } from "src/components/character_editor.tsx";
import { usePromise } from "src/hooks/promise_hook.ts";
import { modifyCharacterHp, ModifyCharacterHpUpdate, modifyCharacterRecovery, ModifyCharacterRecoveryUpdate, saveCharacter } from "src/services/api.ts";
import { ErrorContext } from "src/services/contexts.ts";
import { Character } from "src/types/models.ts";

import 'src/components/character_card/card.scss';

export interface CharacterCardProps {
	character: Character;
	showEdit?: boolean;
	type: CharacterCardType | undefined;
	childPosition?: 'left' | 'right';
	children?: React.ReactElement | React.ReactElement[];
}

type CharacterCardType = 'full' | 'tile';

type CharacterCardOverlayProps = {
	type: 'hp' | 'recoveries';
}

interface ModificationType {
	removedHp: ModifyCharacterHpUpdate;
	removedRecoveries: ModifyCharacterRecoveryUpdate;
}
type ModificationKeys = keyof ModificationType;
type ModificationMutationUpdate<T extends ModificationKeys> = {
	type: T;
	update: ModificationType[T];
}

export function CharacterCard({character, type = 'full', showEdit = false, children, childPosition}: CharacterCardProps) {
	const queryClient = useQueryClient();
	
	const [showHp, setShowHp] = useState(false);
	const [showRecoveries, setShowRecoveries] = useState(false);
	
	const hpRef = useRef<HTMLDivElement | null>(null);
	const recoveriesRef = useRef<HTMLDivElement | null>(null);
	
	const hp = useMemo(() => Character.getHp(character), [character]);
	const recoveries = useMemo(() => Character.getRecoveries(character), [character]);
	
	const [_, setError] = useContext(ErrorContext);
	const [editing, setEditing] = useState(false);
	
	const saveMutation = useMutation({
		mutationFn: (toSave: Partial<CharacterEditorCore>) => {
			return saveCharacter(character.id, toSave);
		},
		onSuccess: (res) =>{
			queryClient.setQueryData(['character', character.id], res);
			
			setEditing(false);
		},
		onError: setError
	});
	
	const modifyMutation = useMutation({
		mutationFn: (mod: ModificationMutationUpdate<ModificationKeys>) => {
			switch (mod.type) {
				case 'removedHp':
					return modifyCharacterHp(character.id, mod.update as ModifyCharacterHpUpdate);
				case 'removedRecoveries':
					return modifyCharacterRecovery(character.id, mod.update as ModifyCharacterRecoveryUpdate);
			}
		},
		onSuccess: (res) => {
			queryClient.setQueryData(['character', character.id], res);
			setShowHp(false);
			setShowRecoveries(false);
		},
	});
	
	const hpBar = useMemo(() => {
		const variant = (hp.percent > 0.5)
			? 'success'
			: (hp.percent > 0.25)
				? 'warning'
				: 'danger';
		
		return (
			<ProgressBar onClick={() => setShowHp(true)} ref={hpRef} variant={variant} now={hp.percent * 100}></ProgressBar>
		);
	}, [hp.percent]);
	
	const recoveriesBar = useMemo(() => {
		return (
			<ProgressBar onClick={() => setShowRecoveries(true)} ref={recoveriesRef} now={recoveries.percent * 100}/>
		);
	}, [recoveries.percent]);
	
	const fullCard = useMemo(() => (
		<>
			<Card className={'character-card'} style={{width: '15rem'}}>
				<div style={{position: 'relative'}}>
					<Card.Img variant={'top'} src={character.pictureUrl ?? undefined} />
					<div style={{position: 'absolute', width: '100%', bottom: '0px'}}>
						<div>
							<Table className={'character-card-table'}>
								<tbody>
								<tr>
									<td>M {character.might}</td>
									<td>A {character.agility}</td>
									<td>R {character.reason}</td>
									<td>I {character.intuition}</td>
									<td>P {character.presence}</td>
								</tr>
								</tbody>
							</Table>
						</div>
					</div>
				</div>
				<Card.Body>
					<Card.Title style={{textAlign: 'center'}}>
						{character.name}
					</Card.Title>
					<div>
						<div>
							HP ({hp.current}/{hp.max})
						</div>
						{hpBar}
					</div>
					<div>
						<div>
							Recoveries ({recoveries.current}/{recoveries.max})
						</div>
						{recoveriesBar}
					</div>
				</Card.Body>
				{
					(!showEdit) ? <></>
					: <Card.Footer>
							<Row style={{justifyContent: 'end'}}>
								{(showEdit)
									? <Col sm={4} style={{textAlign: 'right'}}>
											<Button onClick={() => setEditing(true)}>
												<FontAwesomeIcon icon={faPen}></FontAwesomeIcon>
											</Button>
										</Col>
									: <></>
								}
							</Row>
						</Card.Footer>
				}
			</Card>
		</>
	), [hp.current, hp.max, recoveries.current, recoveries.max, character.pictureUrl, character.might, character.agility, character.reason, character.intuition, character.presence, character.name, hpBar, recoveriesBar, showEdit]);
	
	const tileCard = useMemo(() => {
		function createChildren() {
			if (children == null) {
				return <></>;
			}
			
			if (!Array.isArray(children)) {
				children = [children];
			}
			
			if (children.length == 0) {
				return <></>;
			}
			return (
				<div className={'d-flex flex-column justify-content-between align-items-center m-1'}>
					{children.map((child, i) => (
						<React.Fragment key={i}>
							{child}
						</React.Fragment>
					))}
				</div>
			);
		}
		
		return (
			<Card className={'character-card-tile'}>
				{childPosition === 'left' ? createChildren() : <></>}
				<Card.Img variant={'top'} src={character.pictureUrl ?? undefined} />
				<Card.Body>
					<Card.Title>{character.name}</Card.Title>
					<div className={'mb-2'}>
						{hpBar}
					</div>
					{recoveriesBar}
				</Card.Body>
				{childPosition === 'right' ? createChildren() : <></>}
			</Card>
		);
}, [character.pictureUrl, character.name, hpBar, recoveriesBar, children, childPosition]);
	
	function OverlayDisplay({ type }: CharacterCardOverlayProps) {
		const [modStats, setModStats] = useState<Partial<CharacterEditorCore>>({});
		const [updatePromise, setUpdatePromise] = useState<Promise<unknown>>();
		
		const promiseState = usePromise(updatePromise);
		
		function setValue<K extends keyof CharacterEditorCore>(key: K, value: CharacterEditorCore[K] | undefined) {
			if (value == null || (typeof value == 'number' && isNaN(value))) {
				value = undefined;
			}
			
			setModStats({...modStats, [key]: value});
		}
		
		function submitModification<K extends ModificationKeys>(key: K, type: ModificationType[K]['type']) {
			const mod = modStats[key];
			
			if (mod == null) {
				return;
			}
			
			let p: Promise<Character>;
			switch (key) {
				case 'removedRecoveries':
					p = modifyMutation.mutateAsync({
						type: key,
						update: {
							mod: mod as number,
							type
						}
					});
					break;
				case 'removedHp':
					p = modifyMutation.mutateAsync({
						type: key,
						update: {
							mod: mod as number,
							type
						}
					});
					break;
				default:
					return;
			}
			
			setUpdatePromise(p);
		}
		
		switch (type) {
			case 'hp':
				return (
					<div>
						<FormGroup controlId={'modHp'}>
							<FormLabel>Modify HP</FormLabel>
							<FormControl value={modStats['removedHp']}
							             min={0}
							             onChange={(e) => setValue('removedHp', e.target.value ? parseInt(e.target.value) : undefined)}
							             type={'number'}/>
						</FormGroup>
						<ButtonGroup className={'mt-2 w-100'}>
							<Button disabled={promiseState.loading} onClick={() => submitModification('removedHp', 'DAMAGE')} variant={'danger'}>Damage</Button>
							<Button disabled={promiseState.loading} onClick={() => submitModification('removedHp', 'HEAL')} variant={'success'}>Heal</Button>
						</ButtonGroup>
					</div>
				);
			case 'recoveries':
				return (
					<div>
						<FormGroup controlId={'modRecoveries'}>
							<FormLabel>Modify Recoveries</FormLabel>
							<FormControl value={modStats['removedRecoveries'] ?? ''}
							             onChange={(e) => setValue('removedRecoveries', e.target.value ? parseInt(e.target.value) : undefined)}
							             type={'number'}/>
						</FormGroup>
						<div className={'mt-2 d-flex justify-content-between'}>
							<Button disabled={promiseState.loading} onClick={() => submitModification('removedRecoveries', 'INCREASE')}>Add</Button>
							<Button disabled={promiseState.loading} onClick={() => submitModification('removedRecoveries', 'DECREASE')}>Remove</Button>
						</div>
					</div>
				);
		}
	}
	
	const card = useMemo(() => {
		switch (type) {
			case 'full':
				return fullCard;
			case 'tile':
				return tileCard;
			default:
				return <></>;
		}
	}, [type, fullCard, tileCard]);
	
	return <>
		<Modal show={editing}>
			<Modal.Header>
				<Modal.Title>Edit</Modal.Title>
				<CloseButton onClick={() => setEditing(false)}></CloseButton>
			</Modal.Header>
			<Modal.Body>
				<CharacterEditor character={character} onSubmit={(e) => saveMutation.mutateAsync(e) as unknown as Promise<void>}></CharacterEditor>
			</Modal.Body>
		</Modal>
		<Overlay placement={'auto'} target={hpRef.current} show={showHp} rootCloseEvent={'click'} rootClose={true} onHide={() => setShowHp(false)}>
			{(props) => {
				return (
					<Popover {...props}>
						<PopoverHeader>HP</PopoverHeader>
						<PopoverBody>
							<OverlayDisplay type={'hp'}></OverlayDisplay>
						</PopoverBody>
					</Popover>
				);
			}}
		</Overlay>
		<Overlay placement={'auto'} target={recoveriesRef.current} show={showRecoveries} rootCloseEvent={'click'} rootClose={true} onHide={() => setShowRecoveries(false)}>
			{(props) => {
				return (
					<Popover {...props}>
						<PopoverHeader>Recoveries</PopoverHeader>
						<PopoverBody>
							<OverlayDisplay type={'recoveries'}></OverlayDisplay>
						</PopoverBody>
					</Popover>
				);
			}}
		</Overlay>
		{card}
	</>;
}