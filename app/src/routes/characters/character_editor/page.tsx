import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Show } from "src/components/visibility.tsx";
import { CharacterEditor } from "src/routes/characters/character_editor/character_editor.tsx";
import { fetchCharacter, saveCharacter } from "src/services/api.ts";
import { Character } from "src/types/models.ts";

export function CharacterEditorPage() {
	const params = useParams();
	const [character, setCharacter] = useState<Character>();
	
	useEffect(() => {
		let id: number | undefined;
		try {
			id = parseInt(params.id as string);
		} catch(e) {
			return;
		}
		if (id == null) return;
		
		(async () => {
			const character = await fetchCharacter(id.toString());
			setCharacter(character);
		})();
	}, [params]);
	
	async function save(char: Partial<Character>) {
		if (char == null || character?.id == null) return;
		await saveCharacter(character.id, char);
	}
	
	return <>
		<Show when={!!character}>
			<CharacterEditor character={character!} onSubmit={save}/>
		</Show>
	</>
}