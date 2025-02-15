import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useId, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CharacterCard, CharacterCardExtra } from "src/components/character_card/card.tsx";
import { CharacterConditions } from "src/components/character_conditions.tsx";
import { CharacterSelector } from "src/components/character_selector/character_selector.tsx";
import { useCampaign, useCombat, useWatchCampaign, useWatchCombat } from "src/hooks/api_hooks.ts";
import { CombatModificationUpdate, quickAddCombatant, updateCombatantActive, updateCombatModification, updateCombatRound } from "src/services/api.ts";
import { Character, Combatant } from "src/types/models.ts";
import { parseIntOrUndefined } from "src/utils.ts";
import { Text, Box, Button, Card, Checkbox, Divider, Grid, GridCol, Group, Modal, Stack, TextInput, Title } from "@mantine/core";

export interface CombatPageProps {

}

export function CombatPage({}: CombatPageProps): React.JSX.Element | undefined {
	const params = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	
	const [showNextRound, showNextRoundHandler] = useDisclosure(false);
	const [showModifyCharacters, showModifyCharactersHandler] = useDisclosure(false);
	
	const [showQuickAdd, showQuickAddHandler] = useDisclosure(false);
	const [quickAddConfig, setQuickAddConfig] = useState<Partial<Character>>({});
	
	const clearRoundId = useId();
	const [clearRoundOnly, setClearRoundOnly] = useState(false);
	
	const modCharacterBefore = useRef<Record<number, boolean>>({});
	const modCharacterAfter = useRef<Record<number, boolean>>({});
	
	const id = useMemo(() => parseIntOrUndefined(params.id), [params.id]);
	
	if (id == null) {
		navigate('/');
		return;
	}
	
	const combat = useCombat(id);
	const campaign = useCampaign(combat?.campaign);
	useWatchCampaign(campaign?.campaign.id);
	useWatchCombat(id);
	
	const quickAddMutation = useMutation({
		mutationFn: (character: Partial<Character>) => {
			return quickAddCombatant(id, { character: {name: character.name!, maxHp: character.maxHp!, user: 1} });
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['campaign', campaign?.campaign.id]
			});
			await queryClient.invalidateQueries({
				queryKey: ['combat', id]
			});
			
			showQuickAddHandler.close();
		}
	});
	
	const nextRoundMutation = useMutation({
		mutationFn: () => {
			if (combat == null) {
				return Promise.reject('No combat');
			}
			
			return updateCombatRound(combat.id, { fromRound: combat.round, reset: true, updateConditions: clearRoundOnly });
		},
		onSuccess: async (update) => {
			showNextRoundHandler.close();
			queryClient.setQueryData(['combat', id], update);
			await queryClient.invalidateQueries({
				queryKey: ['campaign', campaign?.campaign.id]
			});
		}
	});
	
	const activeCombatantMutation = useMutation({
		mutationFn: ({combatant, active}: { combatant: Combatant, active: boolean }) => {
			return updateCombatantActive(combatant.id, active);
		},
		onSuccess: () => {
			if (combat != null) {
				return queryClient.invalidateQueries({
					queryKey: ['combat', combat.id]
				});
			}
		}
	});
	
	const combatModificationMutation = useMutation({
		mutationFn: (mod: CombatModificationUpdate) => {
			if (combat == null) {
				return Promise.reject('No combat');
			}
			
			return updateCombatModification(combat.id, mod);
		},
		onSuccess: (update) => {
			showModifyCharactersHandler.close();
			queryClient.setQueryData(['combat', id], update);
		}
	});
	
	// Maps Character ID to Combatant
	const combatantMap = useMemo(() => {
		const map = new Map<number, Combatant>();
		if (combat == null) {
			return map;
		}
		return combat?.combatants.reduce((acc, combatant) => {
			acc.set(combatant.character.id, combatant);
			return acc;
		}, map);
	}, [combat]);
	
	const availableMap = useMemo(() => {
		return campaign?.characters.reduce((acc, character) => {
			const c = combat?.combatants.find(c => c.character.id == character.id);
			if (c) {
				const isActive = c.available;
				const arr = acc.get(isActive) ?? [];
				arr.push(character);
				
				acc.set(isActive, arr);
			}
			return acc;
		}, new Map<boolean, Character[]>());
	}, [campaign?.characters, combat?.combatants]);
	
	const characterDisplay = useMemo(() => {
		
		const getDisplay = (available: boolean) => (
			<Stack gap={2}>
				<Card>
					<Title ta={'center'} order={3}>{available ? 'Available' : 'Unavailable'}</Title>
				</Card>
				{availableMap?.get(available)?.map(c => {
					const combatant = combatantMap.get(c.id);
					return combatant && (
						<CharacterCard key={c.id} onPortraitClick={() => navigate(`/characters/${c.id}`)} character={c} type={'tile'}>
							{{
								[available ? 'right' : 'left']: (
									<CharacterCardExtra>
										<Box>
											<Button onClick={() => activeCombatantMutation.mutate({ combatant, active: !combatant.available })}>
												<FontAwesomeIcon icon={combatant.available ? faArrowRight : faArrowLeft} />
											</Button>
										</Box>
									</CharacterCardExtra>
								),
								bottom: (
									<CharacterCardExtra>
										<Box>
											<CharacterConditions editing={true} character={c} />
										</Box>
									</CharacterCardExtra>
								)
							}}
						</CharacterCard>
					)}
				)}
			</Stack>
		);
		
		return (
			<Grid align={'start'} variant={'fluid'} gutter={2}>
				<GridCol span={'auto'}>
					{getDisplay(true)}
				</GridCol>
				<GridCol span={'auto'}>
					{getDisplay(false)}
				</GridCol>
			</Grid>
		);
	}, [availableMap, activeCombatantMutation, combatantMap, navigate]);
	
	const modifyCharacterModal = useMemo(() => {
		if (combat == null || campaign == null) {
			return;
		}
		
		modCharacterBefore.current = campaign.characters.reduce((acc, character) => {
			acc[character.id] = combatantMap?.get(character.id) != null;
			return acc;
		}, {} as Record<number, boolean>);
		
		modCharacterAfter.current = {...modCharacterBefore.current};
		
		function submit() {
			const add = Object.entries(modCharacterAfter.current)
				.filter(([id, selected]) => selected && !modCharacterBefore.current[parseInt(id)])
				.map(([id]) => parseInt(id));
			
			const remove = Object.entries(modCharacterAfter.current)
				.filter(([id, selected]) => !selected && modCharacterBefore.current[parseInt(id)])
				.map(([id]) => parseInt(id));
			
			const update: CombatModificationUpdate = {};
			if (add.length > 0) {
				update.add = add;
			}
			
			if (remove.length > 0) {
				update.remove = remove;
			}
			
			combatModificationMutation.mutate(update);
		}
		
		return <>
			<Modal title={'Modify'} opened={showModifyCharacters} onClose={showModifyCharactersHandler.close}>
				<CharacterSelector onChange={(e) => modCharacterAfter.current = e}
				                   characters={campaign.characters}
				                   selected={modCharacterBefore.current}/>
				
				<Divider my={'md'} />
				<Group justify={'end'}>
					<Button color="gray" onClick={() => {
						showModifyCharactersHandler.close();
					}}>Cancel</Button>
					<Button onClick={() => submit()}>Submit</Button>
				</Group>
			</Modal>
		</>;
	}, [combat, campaign, showModifyCharacters]);
	
	if (combat == null || campaign == null) {
		return;
	}
	
	return <>
		{modifyCharacterModal}
		<Modal title={'Quick Add'} opened={showQuickAdd} onClose={showQuickAddHandler.close} onEnterTransitionEnd={() => setQuickAddConfig({})}>
			<TextInput label="Name" value={quickAddConfig['name'] ?? ''} onChange={(e) => setQuickAddConfig({...quickAddConfig, name: e.target.value})} />
			<TextInput label={'Max HP'} type={'number'} min={0} value={quickAddConfig['maxHp'] ?? ''} onChange={(e) => setQuickAddConfig({...quickAddConfig, maxHp: parseIntOrUndefined(e.target.value)})} />
			<Divider my={'md'} />
			<Group justify={'end'}>
				<Button disabled={quickAddConfig['name'] == null || quickAddConfig['maxHp'] == null}
					onClick={() => {
					quickAddMutation.mutate(quickAddConfig);
				}}>Submit</Button>
			</Group>
		</Modal>
		
		<Modal title={`Advance to round ${combat.round + 1}`} opened={showNextRound} onClose={showNextRoundHandler.close}>
			<Checkbox label={'Clear round only conditions'} id={clearRoundId} checked={clearRoundOnly} onChange={(e) => setClearRoundOnly(e.target.checked)} />
			
			<Divider my={'md'} />
			<Group justify={'end'}>
				<Button color="gray" onClick={showNextRoundHandler.close}>Cancel</Button>
				<Button onClick={() => {
					nextRoundMutation.mutate();
				}}>Continue</Button>
			</Group>
		</Modal>
		
		<Box m={2}>
			<Card mb={2}>
				<Group justify={'space-between'}>
					<Stack gap={2} justify={'stretch'}>
						<Button variant={'outline'} color={'dark'} onClick={showModifyCharactersHandler.open}>Modify</Button>
						<Button variant={'outline'} color={'dark'} onClick={showQuickAddHandler.open}>Quick Add</Button>
					</Stack>
					<Stack justify={'center'} gap={2}>
						<Button component={'a'}
						        size={'lg'}
						        color={'dark'}
						        variant={'subtle'}
						        href={`/campaigns/${campaign.campaign.id}`}
						        onClick={(e) => {
											e.preventDefault();
											
											const url = `/campaigns/${campaign.campaign.id}`;
											if (e.metaKey || e.ctrlKey) {
												window.open(url, '_blank');
												return;
											}
							        navigate(url);
						        }}>
							{campaign.campaign.name}
						</Button>
						<Text ta={'center'} fw={700}>Round {combat.round}</Text>
					</Stack>
					<Box>
						<Button onClick={showNextRoundHandler.open}>
							<Text mr={2}>Next Round</Text>
							<FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon>
						</Button>
					</Box>
				</Group>
			</Card>
			{characterDisplay}
		</Box>
	</>
}