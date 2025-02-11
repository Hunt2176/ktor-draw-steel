import { Image, Grid, GridCol, Popover as MantinePopover, RingProgress, Text, Button, NumberInput, Divider, Stack, Paper } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useMemo, useRef, useState } from "react";
import { Card, CloseButton, Modal, Overlay, Popover, PopoverBody, PopoverHeader, Table } from "react-bootstrap";
import { CharacterEditor, CharacterEditorCore } from "src/components/character_editor/character_editor.tsx";
import { usePromise } from "src/hooks/promise_hook.ts";
import { modifyCharacterHp, ModifyCharacterHpUpdate, modifyCharacterRecovery, ModifyCharacterRecoveryUpdate, saveCharacter } from "src/services/api.ts";
import { ErrorContext } from "src/services/contexts.ts";
import { Character } from "src/types/models.ts";
import { toTypeOrProvider, toVararg, TypeOrProvider, Vararg } from "src/utils.ts";

import 'src/components/character_card/card.scss';


export interface CharacterCardProps {
	onPortraitClick?: () => void;
	character: Character;
	type: CharacterCardType | undefined;
	children?: CharacterCardChildren;
}

export interface CharacterCardChildren {
	left?: CharacterCardElement;
	right?: CharacterCardElement;
	bottom?: CharacterCardElement;
}

type CharacterCardElement = React.ReactElement<CharacterCardExtraProps, typeof CharacterCardExtra>;

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

export function CharacterCard({ character, type = 'full', children, onPortraitClick }: CharacterCardProps) {
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
		const color = (hp.percent > 0.5)
			? 'green'
			: (hp.percent > 0.25)
				? 'orange'
				: 'red';
		
		const label = <>
			<Text c={color} ta="center" fw={700} size={'xl'} ref={hpRef}>
				{hp.current}/{hp.max}
			</Text>
		</>
		
		return (
			<RingProgress label={label}
			              transitionDuration={250}
			              sections={[
				              {
					              value: hp.percent * 100,
					              color: color
				              }
			              ]}></RingProgress>);
	}, [hp.percent, hp.current, hp.max]);
	
	const recoveriesBar = useMemo(() => {
		return (
			<RingProgress
				label={<Text c={'blue'} ta="center" fw={700} size={'xl'}>{recoveries.current}/{recoveries.max}</Text>}
				transitionDuration={250}
				sections={[
					{
						value: recoveries.percent * 100,
						color: 'blue'
					}
				]}
			/>
		);
	}, [recoveries.percent, recoveries.current, recoveries.max]);
	
	const portrait = useMemo(() => {
		return <>
			<Card.Img onClick={onPortraitClick} className={onPortraitClick ? 'clickable' : undefined} variant={'top'} src={character.pictureUrl ?? undefined} />
		</>;
	}, [onPortraitClick, character.pictureUrl]);
	
	const fullCard = useMemo(() => (
		<>
			<Card className={'character-card'} style={{width: '15rem'}}>
				<div style={{position: 'relative'}}>
					{portrait}
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
				{ children?.bottom &&
					<Card.Footer>
						{children.bottom}
					</Card.Footer>
				}
			</Card>
		</>
	), [hp.current, hp.max, recoveries.current, recoveries.max, character.might, character.agility, character.reason, character.intuition, character.presence, character.name, hpBar, recoveriesBar, children?.bottom, portrait]);
	
	const tileCard = useMemo(() => {
		return (
			<Paper>
				<Stack gap={'xs'}>
					<Grid>
						{ children?.left &&
							<GridCol span={'content'}>
								{children.left}
							</GridCol>
						}
						<GridCol span={'content'}>
							<Image radius={'xs'} w={100} fit={'cover'} style={{objectPosition: 'top'}} src={character.pictureUrl ?? undefined}></Image>
						</GridCol>
						<GridCol span={'content'}>
							<Stack gap={0}>
								<Text size={'xl'} fw={700}>
									{character.name}
								</Text>
								<Grid>
									<GridCol span={'content'}>
										<MantinePopover trapFocus withArrow arrowSize={12}>
											<MantinePopover.Target>
												{hpBar}
											</MantinePopover.Target>
											<MantinePopover.Dropdown>
												<OverlayDisplay type={'hp'}/>
											</MantinePopover.Dropdown>
										</MantinePopover>
									</GridCol>
									
									<GridCol span={'content'}>
										<MantinePopover trapFocus withArrow arrowSize={12}>
											<MantinePopover.Target>
												{recoveriesBar}
											</MantinePopover.Target>
											<MantinePopover.Dropdown>
												<OverlayDisplay type={'recoveries'}/>
											</MantinePopover.Dropdown>
										</MantinePopover>
									</GridCol>
								</Grid>
							</Stack>
						</GridCol>
						{
							children?.right &&
							<GridCol span={'content'}>
								{children.right}
							</GridCol>
						}
					</Grid>
					{ children?.bottom &&
						children.bottom
					}
				</Stack>
			</Paper>
		);
}, [hpBar, recoveriesBar, children?.left, children?.right, character.pictureUrl, character.name, children?.bottom]);
	
	function OverlayDisplay({ type }: CharacterCardOverlayProps) {
		const [modHp, setModHp] = useInputState<number | string>(0);
		const [tempHp, setTempHp] = useInputState<number | string>(character.temporaryHp);
		const [modRecoveries, setModRecoveries] = useInputState<number | string>(0);
		
		const [updatePromise, setUpdatePromise] = useState<Promise<unknown>>();
		
		const promiseState = usePromise(updatePromise);
		
		function saveTempHp() {
			const tempHp = parseInt(modHp as string);
			if (tempHp == null || isNaN(tempHp) || tempHp === character.temporaryHp || tempHp < 0) {
				return;
			}
			
			const p = saveMutation.mutateAsync({ temporaryHp: tempHp });
			setUpdatePromise(p);
		}
		
		function submitModification<K extends ModificationKeys>(key: K, type: ModificationType[K]['type']) {
			let mod: number = NaN;
			
			switch (key) {
				case 'removedRecoveries':
					mod = parseInt(modRecoveries as string);
					break;
				case 'removedHp':
					mod = parseInt(modHp as string);
					break;
			}
			
			if (mod == null || isNaN(mod)) {
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
		
		const tempHpButtonDisabled = useMemo(() => {
			const tHp = parseInt(tempHp as string);
			return tHp == null || isNaN(tHp) || tempHp === character.temporaryHp || tHp < 0;
		}, [character.temporaryHp, tempHp])
		
		switch (type) {
			case 'hp':
				return (
					<div>
						<Stack>
							<NumberInput label={'Modify HP'}
							             value={modHp}
							             onChange={setModHp}
							             min={0}/>
							<Button.Group>
								<Button fullWidth disabled={promiseState.loading} onClick={() => submitModification('removedHp', 'DAMAGE')} color={'red'}>Damage</Button>
								<Button fullWidth disabled={promiseState.loading} onClick={() => submitModification('removedHp', 'HEAL')} color={'green'}>Heal</Button>
							</Button.Group>
						</Stack>
						<Divider my={'sm'} />
						<Stack>
							<NumberInput label={'Temporary HP'}
							             value={tempHp}
							             onChange={setTempHp}
							             min={0}/>
							<Button fullWidth disabled={tempHpButtonDisabled} onClick={() => saveTempHp()}>Submit</Button>
						</Stack>
					</div>
				);
			case 'recoveries':
				return (
					<Stack>
						<NumberInput label={'Modify Recoveries'}
						             value={modRecoveries}
						             onChange={setModRecoveries}
						             min={0}/>
						<Grid>
							<GridCol span={6}>
								<Button fullWidth disabled={promiseState.loading} onClick={() => submitModification('removedRecoveries', 'INCREASE')}>Add</Button>
							</GridCol>
							<GridCol span={6}>
								<Button fullWidth disabled={promiseState.loading} onClick={() => submitModification('removedRecoveries', 'DECREASE')}>Remove</Button>
							</GridCol>
						</Grid>
					</Stack>
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
	
	const extraParams: CharacterCardExtras = useMemo(() => {
		return {
			edit: () => setEditing(true)
		};
	}, [setEditing]);
	
	return (
		<>
			<CharacterCardExtrasContext.Provider value={extraParams}>
				<Modal show={editing}>
					<Modal.Header>
						<Modal.Title>Edit</Modal.Title>
						<CloseButton onClick={() => setEditing(false)}></CloseButton>
					</Modal.Header>
					<Modal.Body>
						<CharacterEditor character={character} onSubmit={(e) => { saveMutation.mutate(e) }}></CharacterEditor>
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
				
			</CharacterCardExtrasContext.Provider>
		</>
	);
}

const CharacterCardExtrasContext = React.createContext<CharacterCardExtras | undefined>(undefined);

export interface CharacterCardExtras {
	edit: () => void;
}

export interface CharacterCardExtraProps {
	children: TypeOrProvider<Vararg<React.ReactElement>, CharacterCardExtras>;
}

export function CharacterCardExtra({ children }: CharacterCardExtraProps) {
	const extras = useContext(CharacterCardExtrasContext);
	if (extras == null) {
		throw new Error('VisitorCardExtra must be used within a CharacterCardExtrasContext');
	}
	
	const results = useMemo(() =>
		toVararg(toTypeOrProvider(children)(extras)),
		[children, extras]
	);
	
	return <>
		{results.map((el, index) => (
			<React.Fragment key={index}>
				{el}
			</React.Fragment>
		))}
	</>;
}