import { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Case, Switch } from "src/components/visibility.tsx";
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
	const charResult = usePromise(charPromise);
	
	return (
		<>
			<Switch>
				<Case when={charResult.loading}>
					<p>Loading...</p>
				</Case>
				<Case when={charResult.error}>
					<p>Error: {charResult?.error}</p>
				</Case>
				<Case when={!!charResult.value}>
					{() => (
						<CharacterCard character={charResult.value!} type={'full'}/>
					)}
				</Case>
			</Switch>
		</>
	)
}