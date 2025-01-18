import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useMemo, useState } from "react";
import { Button, Card, CloseButton, Col, Modal, ProgressBar, Row, Table } from "react-bootstrap";
import { CharacterEditor, CharacterEditorResult } from "src/routes/characters/character_editor/character_editor.tsx";
import { saveCharacter } from "src/services/api.ts";
import { ErrorContext } from "src/services/contexts.ts";
import { Character } from "src/types/models.ts";

import './card.scss';

export interface CharacterCardProps {
	character: Character;
	showEdit?: boolean;
	type: CharacterCardType | undefined;
}

type CharacterCardType = 'full' | 'tile';

export function CharacterCard({character: char, type = 'full', showEdit = false}: CharacterCardProps) {
	const hp = useMemo(() => Character.getHp(char), [char]);
	const recoveries = useMemo(() => Character.getRecoveries(char), [char]);
	
	const [_, setError] = useContext(ErrorContext);
	const [editing, setEditing] = useState(false);
	
	
	const fullCard = () => (
		<>
			<Card className={'character-card'} style={{width: '15rem'}}>
				<div style={{position: 'relative'}}>
					<Card.Img variant={'top'} src={char.pictureUrl} />
					<div style={{position: 'absolute', width: '100%', bottom: '0px'}}>
						<div>
							<Table className={'character-card-table'}>
								<tbody>
								<tr>
									<td>M {char.might}</td>
									<td>A {char.agility}</td>
									<td>R {char.reason}</td>
									<td>I {char.intuition}</td>
									<td>P {char.presence}</td>
								</tr>
								</tbody>
							</Table>
						</div>
					</div>
				</div>
				<Card.Body>
					<Card.Title style={{textAlign: 'center'}}>
						{char.name}
					</Card.Title>
					<div>
						<div>
							HP ({hp.current}/{hp.max})
						</div>
						<ProgressBar variant={'success'} now={hp.percent * 100}></ProgressBar>
					</div>
					<div>
						<div>
							Recoveries ({recoveries.current}/{recoveries.max})
						</div>
						<ProgressBar now={recoveries.percent * 100}></ProgressBar>
					</div>
				</Card.Body>
				{
					(!showEdit) ? <></>
					: <Card.Footer>
							<Row style={{justifyContent: 'end'}}>
								{(showEdit)
									? <Col sm={4} style={{textAlign: 'right'}}>
											<Button onClick={() => setEditing(true)}>
												<FontAwesomeIcon icon={faPen}></FontAwesomeIcon>
											</Button>
										</Col>
									: <></>
								}
							</Row>
						</Card.Footer>
				}
			</Card>
		</>
	)
	
	const tileCard = () => (
		<>
			<Card className={'character-card-tile'}>
				<Card.Img variant={'top'} src={char.pictureUrl} />
				<Card.Body>
					<Card.Title>{char.name}</Card.Title>
				</Card.Body>
			</Card>
		</>
	);
	
	function getCard() {
		switch (type) {
			case 'full':
				return fullCard();
			case 'tile':
				return tileCard();
			default:
				return <></>;
		}
	}
	
	async function onSubmit(result: CharacterEditorResult) {
		try {
			await saveCharacter(char.id, result);
			setEditing(false);
		} catch (e) {
			setError(e);
		}
	}
	
	return <>
		<Modal show={editing}>
			<Modal.Header>
				<Modal.Title>Edit</Modal.Title>
				<CloseButton onClick={() => setEditing(false)}></CloseButton>
			</Modal.Header>
			<Modal.Body>
				<CharacterEditor character={char} onSubmit={onSubmit}></CharacterEditor>
			</Modal.Body>
		</Modal>
		{getCard()}
	</>;
}