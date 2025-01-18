import { useState } from "react";
import { Card, ProgressBar, Table } from "react-bootstrap";
import { Character } from "src/types/models.ts";

import './card.scss';

export interface CharacterCardProps {
	character: Character;
	type: CharacterCardType | undefined;
}

type CharacterCardType = 'full' | 'tile';

export function CharacterCard({character: char, type = 'full'}: CharacterCardProps) {
	
	const [hp] = useState(Character.getHp(char));
	const [recoveries] = useState(Character.getRecoveries(char));
	
	
	
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
	
	switch (type) {
		case 'full':
			return fullCard();
		case 'tile':
			return tileCard();
		default:
			return <></>;
	}
}