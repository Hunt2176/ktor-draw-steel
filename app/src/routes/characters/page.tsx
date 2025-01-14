import { ReactNode, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CharacterCard } from "src/routes/characters/character_card/card.tsx";
import { Character } from "src/types/models.ts";

export function CharacterPage(): ReactNode {
	const params = useParams();
	const [character, setCharacter] = useState<Character>();
	
	useEffect(() => {
		(async () => {
			const id = params.id;
			if (id == null) return;

			setCharacter(await fetchCharacter(id));
		})()
		
	}, []);
	
	return (
		<>
			{
				(character == null)
					? <p>Loading...</p>
					: <>
						<CharacterCard character={character}/>
					</>
			}
		</>
	)
}

async function fetchCharacter(id: string): Promise<Character> {
	const res = await fetch(`/api/characters/${id}`)
	return (await res.json()) as Character
}