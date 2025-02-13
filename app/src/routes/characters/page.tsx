import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCharacter, useWatchCampaign } from "src/hooks/api_hooks.ts";
import { CharacterCard, CharacterCardExtra } from "src/components/character_card/card.tsx";
import { ActionIcon } from "@mantine/core";

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
		return(
			<CharacterCard type={'full'} character={character}>
				{{
					bottom: (
						<CharacterCardExtra>
							{(props) => (
								<div className="d-flex justify-content-end">
									<ActionIcon onClick={() => props.edit()} size={'lg'}>
										<FontAwesomeIcon icon={faPencilAlt}></FontAwesomeIcon>
									</ActionIcon>
								</div>
							)}
						</CharacterCardExtra>
					)
				}}
			</CharacterCard>
		);
	}
}