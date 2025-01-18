import { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCharacter } from "src/hooks/api_hooks.ts";
import { usePromise } from "src/hooks/promise_hook.ts";
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
	
	const charPromise = useCharacter(id);
	const { value: character, error, loading } = usePromise(charPromise);
	
	if (loading) {
		return <div>Loading...</div>;
	}
	
	if (error != null) {
		return <div>Error: {error.message}</div>;
	}
	
	if (character != null) {
		return <CharacterCard type={'full'} character={character} />;
	}
}