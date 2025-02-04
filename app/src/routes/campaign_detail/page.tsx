import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Fragment, useCallback, useContext, useMemo, useState } from "react";
import { Button, Card, CardFooter, CardTitle, Modal, Navbar, NavbarText } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useCampaign, useCombatsForCampaign, useWatchCampaign } from "src/hooks/api_hooks.ts";
import { CharacterCard } from "src/components/character_card/card.tsx";
import { CharacterEditor } from "src/components/character_editor.tsx";
import { createCharacter } from "src/services/api.ts";
import { ErrorContext } from "src/services/contexts.ts";
import { Character } from "src/types/models.ts";
import Element = React.JSX.Element;

export function CampaignDetail() {
	const queryClient = useQueryClient();
	
	const [newCharacter, setNewCharacter] = useState(false);
	const [_, setError] = useContext(ErrorContext);
	
	const params = useParams();
	const navigate = useNavigate();
	const id = parseInt(params.id as string);
	if (isNaN(id) || id == null) {
		console.error(`Invalid campaign ${id}`);
		navigate('/');
		return <></>;
	}
	
	const saveCharacterMutation = useMutation({
		mutationFn: (character: Partial<Character>) => {
			character.campaign = id;
			character.user = 1;
			
			return createCharacter(character);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['campaign', id]
			});
			
			setNewCharacter(false);
		},
		onError: setError
	})
	
	function selectCharacter(character: Character) {
		navigate(`/characters/${character.id}`);
	}
	
	const campaign = useCampaign(id);
	const combats = useCombatsForCampaign(campaign?.campaign.id);
	useWatchCampaign(id);
	
	const newCharacterModal = useMemo(() => {
		const model = Character.new();
		
		return <Modal show={newCharacter} onHide={() => setNewCharacter(false)}>
			<Modal.Header closeButton>
				<Modal.Title>New Character</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<CharacterEditor character={model} onSubmit={saveCharacterMutation.mutateAsync}></CharacterEditor>
			</Modal.Body>
		</Modal>;
	}, [newCharacter, saveCharacterMutation.mutateAsync]);
	
	const combatElements = useMemo(() => {
		if (!combats.length) {
			return <></>;
		}
		
		return <>
			<div>
				<h3>Combats</h3>
				{combats.map((combat) => {
					return <Fragment key={combat.id}>
						<div className="w-25">
							<Card>
								<CardTitle className="d-flex justify-content-between m-2">
									Round: {combat.round}
									<Button onClick={() => navigate(`/combats/${combat.id}`)}>
										View
									</Button>
								</CardTitle>
							</Card>
						</div>
					</Fragment>
				})}
			</div>
		</>;
	}, [combats, navigate]);
	
	const characterElements = useMemo(() => {
		return campaign && campaign.characters.reduce((acc, character, index) => {
			const characterEl = (
				<CharacterCard key={character.id} character={character} type={'tile'}/>
			)
			
			if (index % 5 == 0) {
				acc.push([characterEl]);
			}
			else {
				acc[acc.length - 1].push(characterEl);
			}
			
			return acc;
		}, new Array<Element[]>())
			.map((row, index) => (
				<div className={'d-flex flex-column flex-1'} key={index}>
					{row.map((el) => (el))}
				</div>
			));
	}, [campaign]);
	
	const campaignDisplay = useMemo(() => (
		campaign &&
	    <div className={'d-flex flex-column vh-100'}>
	      <div className={'flex-1'}>
          <Navbar>
              <NavbarText>{campaign.campaign.name}</NavbarText>
          </Navbar>
	      </div>
	      <div className={'flex-2'}>
		      {combatElements}
	      </div>
	      <div className={'flex-3 d-flex flex-column flex-wrap'}>
			      <div className={'d-flex justify-content-center my-2'}>
				      <Button onClick={() => setNewCharacter(true)}>Add Character</Button>
			      </div>
	          <div className={'d-flex'}>
							{characterElements?.map((row) => (
								row
							))}
	          </div>
	      </div>
	    </div>
	), [campaign, characterElements, combatElements]);
	
	if (campaign) {
		return (
			<>
				{newCharacterModal}
				{campaignDisplay}
			</>
		);
	}
}