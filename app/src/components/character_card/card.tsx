import { Card, Button, Divider, Grid, GridCol, Group, Image, NumberInput, Popover, RingProgress, Stack, Text, Modal } from "@mantine/core";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useMemo, useRef, useState } from "react";
import { CharacterEditor, CharacterEditorCore } from "src/components/character_editor/character_editor.tsx";
import { usePromise } from "src/hooks/promise_hook.ts";
import { modifyCharacterHp, ModifyCharacterHpUpdate, modifyCharacterRecovery, ModifyCharacterRecoveryUpdate, saveCharacter } from "src/services/api.ts";
import { ErrorContext } from "src/services/contexts.ts";
import { Character } from "src/types/models.ts";
import { parseIntOrUndefined, toTypeOrProvider, toVararg, TypeOrProvider, Vararg } from "src/utils.ts";


export interface CharacterCardProps {
	stackId?: string,
	uploadStackId?: string,
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

export function CharacterCard({ stackId, uploadStackId, character, type = 'full', children, onPortraitClick }: CharacterCardProps) {
	const queryClient = useQueryClient();
	
	const hpRef = useRef<HTMLDivElement | null>(null);
	const [editorOpened, editorOpenedHandler] = useDisclosure(false);
	
	const hp = useMemo(() => Character.getHp(character), [character]);
	const recoveries = useMemo(() => Character.getRecoveries(character), [character]);
	
	const [_, setError] = useContext(ErrorContext);
	
	const saveMutation = useMutation({
		mutationFn: (toSave: Partial<CharacterEditorCore>) => {
			return saveCharacter(character.id, toSave);
		},
		onSuccess: (res) =>{
			queryClient.setQueryData(['character', character.id], res);
			editorOpenedHandler.close();
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
		},
	});
	
	const hpBar = useMemo(() => {
		const color = (hp.percent > 0.5)
			? 'green'
			: (hp.percent > 0.25)
				? 'orange'
				: 'red';
		
		const label = <>
			<Text c={color} ta="center" fw={700} size={'lg'} ref={hpRef} style={{textShadow: '0px 0px 2px rgba(0,0,0,0.3)'}}>
				{hp.current}/{hp.max}
			</Text>
		</>
		
		const ring = (
			<RingProgress label={label}
			              size={100}
			              transitionDuration={250}
			              sections={[
				              {
					              value: hp.percent * 100,
					              color: color
				              }
			              ]}></RingProgress>);
		
		return (
			<Popover trapFocus withArrow arrowSize={12}>
				<Popover.Target>
					{ring}
				</Popover.Target>
				<Popover.Dropdown>
					<OverlayDisplay type={'hp'}/>
				</Popover.Dropdown>
			</Popover>
		);
	}, [hp.percent, hp.current, hp.max]);
	
	const recoveriesBar = useMemo(() => {
		const ring = (
			<RingProgress
				label={<Text style={{textShadow: '0px 0px 2px rgba(0,0,0,0.3)'}} c={'blue'} ta="center" fw={700} size={'lg'}>{recoveries.current}/{recoveries.max}</Text>}
				size={100}
				transitionDuration={250}
				sections={[
					{
						value: recoveries.percent * 100,
						color: 'blue'
					}
				]}
			/>
		);
		
		return (
			<Popover trapFocus withArrow arrowSize={12}>
				<Popover.Target>
					{ring}
				</Popover.Target>
				<Popover.Dropdown>
					<OverlayDisplay type={'recoveries'}/>
				</Popover.Dropdown>
			</Popover>
		);
	}, [recoveries.percent, recoveries.current, recoveries.max]);
	
	const fullCard = useMemo(() => (
			<Card withBorder shadow={'xs'} style={{width: '15rem'}}>
				<Card.Section withBorder>
					<div style={{position: 'relative'}}>
						<Image onClick={onPortraitClick} src={character.pictureUrl ?? undefined}></Image>
						<div style={{position: 'absolute', width: '100%', bottom: '0px'}}>
							<Group justify={'space-around'}>
								<Text fw={600} component={'div'}>
									M {character.might}
								</Text>
								<Text fw={600} component={'div'}>
									A {character.agility}
								</Text>
								<Text fw={600} component={'div'}>
									R {character.reason}
								</Text>
								<Text fw={600} component={'div'}>
									I {character.intuition}
								</Text>
								<Text fw={600} component={'div'}>
									P {character.presence}
								</Text>
							</Group>
						</div>
					</div>
				</Card.Section>
				<Text fw={700} size={'xl'} ta={'center'}>
					{character.name}
				</Text>
				<Card.Section>
					<Group justify={'space-around'}>
						{hpBar}
						{recoveriesBar}
					</Group>
				</Card.Section>
				{ children?.bottom &&
					<>
						<Card.Section mb={'xs'} withBorder></Card.Section>
						{children.bottom}
					</>
				}
			</Card>
	), [character.might, character.agility, character.reason, character.intuition, character.presence, character.name, hpBar, recoveriesBar, children?.bottom, character.pictureUrl, onPortraitClick]);
	
	const tileCard = useMemo(() => {
		return (
			<Card>
				<Stack gap={'xs'}>
					<Grid>
						{ children?.left &&
							<GridCol span={'auto'}>
								{children.left}
							</GridCol>
						}
						<GridCol span={'content'}>
							<Image onClick={onPortraitClick} radius={'xs'} w={100} fit={'cover'} style={{objectPosition: 'top'}} src={character.pictureUrl ?? undefined}></Image>
						</GridCol>
						<GridCol span={'content'}>
							<Stack gap={0}>
								<Text size={'xl'} fw={700}>
									{character.name}
								</Text>
								<Grid>
									<GridCol span={'content'}>
										{hpBar}
									</GridCol>
									<GridCol span={'content'}>
										{recoveriesBar}
									</GridCol>
								</Grid>
							</Stack>
						</GridCol>
						{
							children?.right &&
							<GridCol span={'auto'}>
								{children.right}
							</GridCol>
						}
					</Grid>
					{ children?.bottom &&
						children.bottom
					}
				</Stack>
			</Card>
		);
		}, [hpBar, recoveriesBar, children?.left, children?.right, character.pictureUrl, character.name, children?.bottom, onPortraitClick]);
	
	function OverlayDisplay({ type }: CharacterCardOverlayProps) {
		const [modHp, setModHp] = useInputState<number | string>('');
		const [tempHp, setTempHp] = useInputState<number | string>(character.temporaryHp == 0 ? '' : character.temporaryHp);
		const [modRecoveries, setModRecoveries] = useInputState<number | string>('');
		
		const [updatePromise, setUpdatePromise] = useState<Promise<unknown>>();
		
		const promiseState = usePromise(updatePromise);
		
		function saveTempHp() {
			const toSet = parseIntOrUndefined(tempHp);
			if (toSet == null || toSet === character.temporaryHp || toSet < 0) {
				return;
			}
			
			const p = saveMutation.mutateAsync({ temporaryHp: toSet });
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
	
	const editorModal = useMemo(() => {
		return <>
			<Modal stackId={stackId} opened={editorOpened} onClose={editorOpenedHandler.close}>
				<CharacterEditor uploadStackId={uploadStackId} character={character} onSubmit={(e) => {
					saveMutation.mutate(e)
				}}></CharacterEditor>
			</Modal>
		</>;
	}, [character, saveMutation, stackId, uploadStackId, editorOpened]);
	
	const extraParams: CharacterCardExtras = useMemo(() => {
		return {
			edit: editorOpenedHandler.open
		};
	}, [editorOpenedHandler.open]);
	
	return (
		<>
			{editorModal}
			<CharacterCardExtrasContext.Provider value={extraParams}>
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