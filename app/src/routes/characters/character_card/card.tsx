import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useMemo, useState } from "react";
import { Button, Card, CloseButton, Col, Modal, ProgressBar, Row, Table } from "react-bootstrap";
import { CharacterEditor, CharacterEditorCore, CharacterEditorResult } from "src/routes/characters/character_editor/character_editor.tsx";
import { saveCharacter } from "src/services/api.ts";
import { ErrorContext } from "src/services/contexts.ts";
import { Character, CharacterPool } from "src/types/models.ts";

import './card.scss';

export interface CharacterCardProps {
	character: Character;
	showEdit?: boolean;
	type: CharacterCardType | undefined;
}

type CharacterCardType = 'full' | 'tile';

export function CharacterCard({character: char, type = 'full', showEdit = false}: CharacterCardProps) {
	const queryClient = useQueryClient();
	
	const hp = useMemo(() => Character.getHp(char), [char]);
	const recoveries = useMemo(() => Character.getRecoveries(char), [char]);
	
	const [_, setError] = useContext(ErrorContext);
	const [editing, setEditing] = useState(false);
	
	const saveMutation = useMutation({
		mutationFn: (toSave: Partial<CharacterEditorCore>) => {
			return saveCharacter(char.id, toSave);
		},
		onSuccess: () =>{
			queryClient.invalidateQueries({
				queryKey: ['character', char.id]
			});
			setEditing(false);
		},
		onError: setError
	});
	
	function getBar(pool: CharacterPool, variant?: 'success' | 'warning' | 'danger') {
		return <ProgressBar variant={variant} now={pool.percent * 100}></ProgressBar>;
	}
	
	function getHpBar(pool: CharacterPool) {
		const variant = (pool.percent > 0.5)
			? 'success'
			: (pool.percent > 0.25)
				? 'warning'
				: 'danger';
		
		return getBar(pool, variant);
	}
	
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
						{getHpBar(hp)}
					</div>
					<div>
						<div>
							Recoveries ({recoveries.current}/{recoveries.max})
						</div>
						{getBar(recoveries)}
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
					<div className={'mb-2'}>
						{getHpBar(hp)}
					</div>
					{getBar(recoveries)}
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
	
	return <>
		<Modal show={editing}>
			<Modal.Header>
				<Modal.Title>Edit</Modal.Title>
				<CloseButton onClick={() => setEditing(false)}></CloseButton>
			</Modal.Header>
			<Modal.Body>
				<CharacterEditor character={char} onSubmit={saveMutation.mutateAsync}></CharacterEditor>
			</Modal.Body>
		</Modal>
		{getCard()}
	</>;
}