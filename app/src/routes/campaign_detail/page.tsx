import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { Clickable } from "src/components/utility.tsx";
import { useCampaign, useWatchCampaign } from "src/hooks/api_hooks.ts";
import { CharacterCard } from "src/routes/characters/character_card/card.tsx";
import { CharacterEditor } from "src/routes/characters/character_editor/character_editor.tsx";
import { createCharacter } from "src/services/api.ts";
import { ErrorContext } from "src/services/contexts.ts";
import { Character } from "src/types/models.ts";

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
	useWatchCampaign(id);
	
	function newCharacterModal() {
		const model = Character.new();
		
		return <Modal show={newCharacter} onHide={() => setNewCharacter(false)}>
			<Modal.Header closeButton>
				<Modal.Title>New Character</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<CharacterEditor character={model} onSubmit={saveCharacterMutation.mutateAsync}></CharacterEditor>
			</Modal.Body>
		</Modal>;
	}
	
	if (campaign) {
		return <>
			{newCharacterModal()}
			<h1>{campaign.campaign.name}</h1>
			<Button onClick={() => setNewCharacter(true)}>
				New Character
			</Button>
			{campaign.characters.map(c => (
				<Clickable onClick={() => selectCharacter(c)} key={c.id}>
					<CharacterCard character={c} type={'tile'}></CharacterCard>
				</Clickable>
			))}
		</>
	}
}