import { faArrowLeft, faArrowRight, faPencil } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { Button, Card, CardTitle, Modal, ModalFooter, ModalHeader, ModalTitle } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CharacterCard, CharacterCardExtra } from "src/components/character_card/card.tsx";
import { CharacterConditions } from "src/components/character_conditions.tsx";
import { useCampaign, useCombat, useWatchCampaign, useWatchCombat } from "src/hooks/api_hooks.ts";
import { updateCombatantActive, updateCombatRound } from "src/services/api.ts";
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
	
	const id = useMemo(() => parseIntOrUndefined(params.id), [params.id]);
	
	if (id == null) {
		navigate('/');
		return;
	}
	
	const combat = useCombat(id);
	const campaign = useCampaign(combat?.campaign);
	useWatchCampaign(campaign?.campaign.id);
	useWatchCombat(id);
	
	const nextRoundMutation = useMutation({
		mutationFn: () => {
			if (combat == null) {
				return Promise.reject('No combat');
			}
			
			return updateCombatRound(combat.id, { fromRound: combat.round, reset: true });
		},
		onSuccess: (update) => {
			setShowNextRound(false);
			queryClient.setQueryData(['combat', id], update);
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
						<CharacterCard key={c.id} character={c} type={'tile'}>
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
	}, [availableMap, activeCombatantMutation, combatantMap]);
	
	if (combat == null || campaign == null) {
		return;
	}
	
	return <>
		<Modal show={showNextRound}>
			<ModalHeader>
				<ModalTitle>Advance to round {combat.round + 1}</ModalTitle>
			</ModalHeader>
			<ModalFooter>
				<Button onClick={() => setShowNextRound(false)}>Cancel</Button>
				<Button onClick={() => {
					nextRoundMutation.mutate();
				}}>Continue</Button>
			</ModalFooter>
		</Modal>
		
		<div className={'m-2'}>
			<Card className={'mb-2'}>
				<CardTitle className={'d-flex justify-content-between m-2'}>
					<div className={'col-4 d-flex justify-content-start align-items-center'}>
					
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