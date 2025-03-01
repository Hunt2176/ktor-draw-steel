import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode, useId } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCharacter, useWatchCampaign } from "hooks/api_hooks.ts";
import { CharacterCard, CharacterCardExtra } from "components/character_card/card.tsx";
import { ActionIcon, Group, Modal, useModalsStack } from "@mantine/core";

export function CharacterPage(): ReactNode {
	const params = useParams();
	const navigator = useNavigate();
	const id = parseInt(params.id as string);
	
	const stack = useModalsStack(['character-editor', 'upload-modal']);
	
	if (isNaN(id) || id == null) {
		console.error(`Invalid character ${id}`);
		navigator('/');
		return <></>;
	}
	
	const { data: character } = useCharacter(id);
	useWatchCampaign(character?.campaign);
	
	if (character != null) {
		return(
			<Modal.Stack>
				<CharacterCard stackId={'character-editor'} uploadStackId={'upload-modal'} type={'full'} character={character}>
					{{
						bottom: (
							<CharacterCardExtra>
								{(props) => (
									<Group justify={'end'}>
										<ActionIcon onClick={() => props.edit()} size={'lg'}>
											<FontAwesomeIcon icon={faPencilAlt}></FontAwesomeIcon>
										</ActionIcon>
									</Group>
								)}
							</CharacterCardExtra>
						)
					}}
				</CharacterCard>
			</Modal.Stack>
		);
	}
}