import { useContext, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { Clickable } from "src/components/utility.tsx";
import { useCampaign } from "src/hooks/api_hooks.ts";
import { usePromise } from "src/hooks/promise_hook.ts";
import { CharacterCard } from "src/routes/characters/character_card/card.tsx";
import { CharacterEditor } from "src/routes/characters/character_editor/character_editor.tsx";
import { ErrorContext } from "src/services/contexts.ts";
import { Character } from "src/types/models.ts";

export function CampaignDetail() {
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
	
	const campaignPromise = useCampaign(id);
	const {value: campaign, error, loading} = usePromise(campaignPromise);
	
	async function submitNewCharacter(character: Partial<Character>) {
		character.campaign = id;
		character.user = 1;
		
		try {
			await fetch(`/api/characters`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(character),
			});
			setNewCharacter(false);
		} catch (e) {
			setError(e);
		}
	}
	
	function newCharacterModal() {
		const model = Character.new();
		
		return <Modal show={newCharacter} onHide={() => setNewCharacter(false)}>
			<Modal.Header closeButton>
				<Modal.Title>New Character</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<CharacterEditor character={model} onSubmit={submitNewCharacter}></CharacterEditor>
			</Modal.Body>
		</Modal>;
	}
	
	if (loading) {
		return <p>Loading...</p>;
	}
	if (error) {
		return <p>Error: {error}</p>;
	}
	
	if (campaign) {
		return <>
			{newCharacterModal()}
			<h1>{campaign.campaign.name}</h1>
			<Button onClick={() => setNewCharacter(true)}>
				New Character
			</Button>
			{campaign.characters.map(c => (
				<Clickable onClick={() => navigate(`/characters/${c.id}`)} key={c.id}>
					<CharacterCard character={c} type={'tile'}></CharacterCard>
				</Clickable>
			))}
		</>
	}
}