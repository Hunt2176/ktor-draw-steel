import { Card, Button, Divider, Grid, GridCol, Group, Image, NumberInput, Popover, RingProgress, Stack, Text, Modal, Box, RingProgressProps, MantineColor } from "@mantine/core";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { ReactNode, useContext, useMemo, useRef, useState } from "react";
import { CharacterEditor, CharacterEditorCore } from "components/character_editor/character_editor.tsx";
import { usePromise } from "hooks/promise_hook.ts";
import { deleteCharacter, modifyCharacterHp, ModifyCharacterHpUpdate, modifyCharacterRecovery, ModifyCharacterRecoveryUpdate, saveCharacter } from "services/api.ts";
import { ErrorContext } from "services/contexts.ts";
import { Character } from "types/models.ts";
import { builder, nonNullBuilder, parseIntOrUndefined, toTypeOrProvider, toVararg, TypeOrProvider, Vararg } from "utils.ts";


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
	gauges?: CharacterCardElement;
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
	
	const deleteMutation = useMutation({
		mutationFn: async () => {
			return deleteCharacter(character.id);
		},
		onSuccess: () => {
			return queryClient.invalidateQueries({
				queryKey: ['character', character.id]
			});
		}
	});
	
	const hpBar = useMemo(() => {
		const overColor = 'yellow';
		const underColor = 'dark';
		
		const color = (hp.percent > 0.5)
			? 'green'
			: (hp.percent > 0.25)
				? 'orange'
				: 'red';
		
		let ringFooter: ReactNode = undefined;
		let rootColor: string | undefined;
		let sections: RingProgressProps['sections'] = [
			{
				value: hp.percent * 100,
				color: color
			},
		];
		
		let currentText = hp.current;
		let maxText = hp.max;
		
		let currentHpColor = color;
		
		if (hp.current > hp.max) {
			rootColor = 'green';
			
			const offset = hp.current - hp.max;
			currentHpColor = overColor;
			
			sections = [
				{
					value: (offset / hp.max) * 100,
					color: overColor
				}
			];
		}
		else if (hp.current <= 0) {
			rootColor = 'red';
			
			if (hp.current < 0) {
				const newMax = hp.max / 2;
				maxText = -newMax;
				
				sections = [
					{
						value: (Math.abs(hp.current) / newMax) * 100,
						color: underColor
					}
				];
			}
		}
		
		const textProps = {
			c: color,
			size: 'lg',
			style: { textShadow: '0px 0px 2px rgba(0,0,0,0.3)' },
			fw: 700,
			span: true,
		};
		
		let label = <Box ta={'center'}>
			<Text {...textProps} c={currentHpColor}>
				{currentText}
			</Text>
			<Text {...textProps}>
				/
			</Text>
			<Text {...textProps}>
				{maxText}
			</Text>
		</Box>
		
		if (character.minions > 0) {
			const colors: MantineColor[] = ['red', 'orange', 'green', 'grape', 'teal'];
			rootColor = undefined; // show unfilled portion between minion chunks
			sections = [];

			const num = character.minions;
			const chunk = hp.max / num;

			if (chunk > 0) {
				for (let i = 0; i < num; i++) {
					const start = i * chunk;
					const filledInChunk = Math.max(0, Math.min(hp.current - start, chunk)); // clamp to [0, chunk]
					const value = (filledInChunk / chunk) * (100 / num); // scale per-chunk to whole ring
					if (value > 0) {
						sections.push({
							value,
							color: colors[i % colors.length],
						});
					}
				}
			}
		}
		
		const ring = (
			<RingProgress roundCaps
			              label={label}
			              size={100}
			              transitionDuration={250}
			              rootColor={rootColor}
			              sections={sections}></RingProgress>
		);
		
		
		return (
			<Popover trapFocus withArrow arrowSize={12}>
				<Popover.Target>
					<Stack>
						{ring}
						{ringFooter}
					</Stack>
				</Popover.Target>
				<Popover.Dropdown>
					<OverlayDisplay type={'hp'}/>
				</Popover.Dropdown>
			</Popover>
		);
	}, [hp.percent, hp.current, hp.max, hp.temporary, character.minions]);
	
	const recoveriesBar = useMemo(() => {
		const ring = (
			<RingProgress
				roundCaps
				label={
					<Text style={{textShadow: '0px 0px 2px rgba(0,0,0,0.3)'}} c={'blue'} ta="center" fw={700} size={'lg'}>
						{recoveries.current}/{recoveries.max}
					</Text>
				}
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
	}, [recoveries.percent, recoveries.current, recoveries.max, recoveries.temporary, character.minions]);
	
	const image = useMemo(() => (
		<Image fit={'cover'}
		       w={type != 'full' ? '100px' : undefined}
		       flex={type != 'full' ? 'revert' : undefined}
		       style={{objectPosition: 'top center'}}
		       onClick={onPortraitClick}
		       src={character.pictureUrl ?? undefined}/>
	), [character.pictureUrl, onPortraitClick, type]);
	
	const fullCard = useMemo(() => (
			<Card withBorder shadow={'xs'} style={{width: '15rem'}}>
				<Card.Section withBorder>
					<div style={{position: 'relative'}}>
						{image}
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
						{ children?.gauges && children.gauges }
					</Group>
				</Card.Section>
				{ children?.bottom &&
					<>
						<Card.Section mb={'xs'} withBorder></Card.Section>
						{children.bottom}
					</>
				}
			</Card>
	), [character.might, character.agility, character.reason, character.intuition, character.presence, character.name, hpBar, recoveriesBar, children?.bottom, children?.gauges, image]);
	
	const tileCard = useMemo(() => {
		return (
			<Card>
				<Stack gap={'xs'}>
					<Group align={'stretch'} justify={'stretch'} wrap={'nowrap'} gap={0}>
						{ children?.left &&
							<Box style={{flexShrink: 1}}>
								{children.left}
							</Box>
						}
						{image}
						<Stack flex={5} gap={0}>
							<Text size={'xl'} fw={700} pl={'xs'}>
								{character.name}
							</Text>
							<Group gap={0}>
								{hpBar}
								{recoveriesBar}
							</Group>
							{
								nonNullBuilder(children?.gauges, (gauges) => (
									<Group gap={0}>
										{gauges}
									</Group>
								))
							}
						</Stack>
						{
							nonNullBuilder(children?.right, (cardEl) => (
								<Box style={{flexShrink: 1}}>
									{cardEl}
								</Box>
							))
						}
					</Group>
					{
						nonNullBuilder(children?.bottom, (el) => el)
					}
				</Stack>
			</Card>
		);
		}, [hpBar, recoveriesBar, children?.left, children?.right, character?.name, children?.bottom, children?.gauges, image]);
	
	function OverlayDisplay({ type }: CharacterCardOverlayProps) {
		const [modHp, setModHp] = useInputState<number | string>('');
		const [tempHp, setTempHp] = useInputState<number | string>(character.temporaryHp == 0 ? '' : character.temporaryHp);
		
		const [modRecoveries, setModRecoveries] = useInputState<number | string>('');
		const [tempRecoveries, setTempRecoveries] = useInputState<number | string>(character.temporaryRecoveries == 0 ? '' : character.temporaryRecoveries);
		
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
		
		function saveTempRecoveries() {
			const toSet = parseIntOrUndefined(tempRecoveries);
			if (toSet == null || toSet === character.temporaryRecoveries || toSet < 0) {
				return;
			}
			
			const p = saveMutation.mutateAsync({ temporaryRecoveries: toSet });
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
		
		const tempRecoveriesButtonDisabled = useMemo(() => {
			const tRec = parseInt(tempRecoveries as string);
			return tRec == null || isNaN(tRec) || tempRecoveries === character.temporaryRecoveries || tRec < 0;
		}, [character.temporaryRecoveries, tempRecoveries])
		
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
					<div>
						<Stack>
							<NumberInput label={'Modify Recoveries'}
							             value={modRecoveries}
							             onChange={setModRecoveries}
							             min={0}/>
							<Button.Group>
								<Button fullWidth disabled={promiseState.loading} color={'green'} onClick={() => submitModification('removedRecoveries', 'INCREASE')}>Increase</Button>
								<Button fullWidth disabled={promiseState.loading} color={'red'} onClick={() => submitModification('removedRecoveries', 'DECREASE')}>Decrease</Button>
							</Button.Group>
						</Stack>
						<Divider my={'sm'} />
						<Stack>
							<NumberInput label={'Temporary Recoveries'}
							             value={tempRecoveries}
							             onChange={setTempRecoveries}
							             min={0}/>
							<Button fullWidth disabled={tempRecoveriesButtonDisabled} onClick={() => saveTempRecoveries()}>Submit</Button>
						</Stack>
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