import { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCharacter, useWatchCampaign } from "src/hooks/api_hooks.ts";
import { CharacterCard } from "src/routes/characters/character_card/card.tsx";

export function CharacterPage(): ReactNode {
	const params = useParams();
	const navigator = useNavigate();
	const id = parseInt(params.id as string);
	
	if (isNaN(id) || id == null) {
		console.error(`Invalid character ${id}`);
		navigator('/');
		return <></>;
	}
	
	const character = useCharacter(id);
	useWatchCampaign(character?.campaign);
	
	if (character != null) {
		return <CharacterCard showEdit={true} type={'full'} character={character} />;
	}
}