import { faArrowLeft, faArrowRight, faPencil } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useId, useMemo, useRef, useState } from "react";
import { Button, Card, CardTitle, CloseButton, FormCheck, FormControl, FormGroup, FormLabel, FormText, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CharacterCard, CharacterCardExtra } from "src/components/character_card/card.tsx";
import { CharacterConditions } from "src/components/character_conditions.tsx";
import { CharacterSelector } from "src/components/character_selector/character_selector.tsx";
import { useCampaign, useCombat, useWatchCampaign, useWatchCombat } from "src/hooks/api_hooks.ts";
import { CombatModificationUpdate, quickAddCombatant, updateCombatantActive, updateCombatModification, updateCombatRound } from "src/services/api.ts";
import { Character, Combatant } from "src/types/models.ts";
import { parseIntOrUndefined } from "src/utils.ts";

import './page.scss';

export interface CombatPageProps {

}

export function CombatPage({}: CombatPageProps): React.JSX.Element | undefined {
	const params = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	
	const [showNextRound, setShowNextRound] = useState(false);
	const [showModifyCharacters, setShowModifyCharacters] = useState(false);
	
	const [showQuickAdd, setShowQuickAdd] = useState(false);
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
		onSuccess: async (combat) => {
			await queryClient.invalidateQueries({
				queryKey: ['campaign', campaign?.campaign.id]
			});
			await queryClient.invalidateQueries({
				queryKey: ['combat', id]
			});
			
			setShowQuickAdd(false);
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
			setShowNextRound(false);
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
			setShowModifyCharacters(false);
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
			<div className={'d-flex flex-column flex-1'}>
				<Card>
					<CardTitle className={'d-flex justify-content-center my-2'}>{available ? 'Available' : 'Unavailable'}</CardTitle>
				</Card>
				{availableMap?.get(available)?.map(c => {
					const combatant = combatantMap.get(c.id);
					return combatant && (
						<CharacterCard key={c.id} onPortraitClick={() => navigate(`/characters/${c.id}`)} character={c} type={'tile'}>
							{{
								[available ? 'right' : 'left']: (
									<CharacterCardExtra>
										<div className={'d-flex flex-column justify-content-between align-content-center m-1'}>
											<Button onClick={() => activeCombatantMutation.mutate({ combatant, active: !combatant.available })}>
												<FontAwesomeIcon icon={combatant.available ? faArrowRight : faArrowLeft} />
											</Button>
										</div>
									</CharacterCardExtra>
								),
								bottom: (
									<CharacterCardExtra>
										<div className="m-1">
											<CharacterConditions editing={true} character={c} />
										</div>
									</CharacterCardExtra>
								)
							}}
						</CharacterCard>
					)}
				)}
			</div>
		);
		
		return (
			<div className={'d-flex combatant-container'}>
				{getDisplay(true)}
				{getDisplay(false)}
			</div>
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
			<Modal show={showModifyCharacters}>
				<ModalHeader>
					<ModalTitle>Modify</ModalTitle>
					<CloseButton onClick={() => setShowModifyCharacters(false)}></CloseButton>
				</ModalHeader>
				<ModalBody>
					<CharacterSelector onChange={(e) => modCharacterAfter.current = e}
					                   characters={campaign.characters}
					                   selected={modCharacterBefore.current}/>
				</ModalBody>
				<ModalFooter>
					<Button variant="secondary" onClick={() => {
						setShowModifyCharacters(false);
					}}>Cancel</Button>
					<Button onClick={() => submit()}>Submit</Button>
				</ModalFooter>
			</Modal>
		</>;
	}, [combat, campaign, showModifyCharacters]);
	
	if (combat == null || campaign == null) {
		return;
	}
	
	return <>
		{modifyCharacterModal}
		<Modal show={showQuickAdd} onShow={() => setQuickAddConfig({})}>
			<ModalHeader>
				<ModalTitle>Quick Add</ModalTitle>
				<CloseButton onClick={() => setShowQuickAdd(false)}></CloseButton>
			</ModalHeader>
			<ModalBody>
				<FormGroup controlId={`${id}-quickAdd-name`}>
					<FormLabel>
						Name
					</FormLabel>
					<FormControl value={quickAddConfig['name'] ?? ''}
					             onChange={(e) => setQuickAddConfig({...quickAddConfig, name: e.target.value})}></FormControl>
				</FormGroup>
				<FormGroup>
					<FormLabel>
						Max HP
					</FormLabel>
					<FormControl type={'number'} min={0} value={quickAddConfig['maxHp'] ?? ''}
					             onChange={(e) => setQuickAddConfig({...quickAddConfig, maxHp: parseIntOrUndefined(e.target.value)})}></FormControl>
				</FormGroup>
			</ModalBody>
			<ModalFooter>
				<Button disabled={quickAddConfig['name'] == null || quickAddConfig['maxHp'] == null}
					onClick={() => {
					quickAddMutation.mutate(quickAddConfig);
				}}>Submit</Button>
			</ModalFooter>
		</Modal>
		<Modal show={showNextRound}>
			<ModalHeader>
				<ModalTitle>
					Advance to round {combat.round + 1}
				</ModalTitle>
			</ModalHeader>
			<ModalBody>
					<FormCheck label="Clear round only conditions"
					           id={clearRoundId}
					           checked={clearRoundOnly}
					           onChange={(e) => setClearRoundOnly(e.target.checked)}/>
			</ModalBody>
			<ModalFooter>
				<Button variant="secondary" onClick={() => setShowNextRound(false)}>Cancel</Button>
				<Button onClick={() => {
					nextRoundMutation.mutate();
				}}>Continue</Button>
			</ModalFooter>
		</Modal>
		
		<div className={'m-2'}>
			<Card className={'mb-2'}>
				<CardTitle className={'d-flex justify-content-between m-2'}>
					<div className={'col-4 d-flex justify-content-start align-items-center'}>
						<Button onClick={() => setShowModifyCharacters(true)} variant="outline-secondary">Modify</Button>
						<Button onClick={() => setShowQuickAdd(true)} variant="outline-secondary" className={'ms-2'}>Quick Add</Button>
					</div>
					<div className={'col-4 d-flex flex-column justify-content-center align-items-center'}>
						<Link to={`/campaigns/${campaign.campaign.id}`}>
							{campaign.campaign.name}
						</Link>
						<span>
							Round {combat.round}
						</span>
					</div>
					<div className={'col-4 d-flex justify-content-end alight-items-center'}>
						<Button onClick={() => setShowNextRound(true)}>
							<span className={'me-2'}>Next Round</span>
							<FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon>
						</Button>
					</div>
				</CardTitle>
			</Card>
			{characterDisplay}
		</div>
	</>
}