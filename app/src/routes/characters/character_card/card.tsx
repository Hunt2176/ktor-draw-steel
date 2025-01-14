import { useState } from "react";
import { Card, ProgressBar, Table } from "react-bootstrap";
import { Character } from "src/types/models.ts";

import './card.scss';

export interface CharacterCardProps {
	character: Character;
}
export function CharacterCard({character: char}: CharacterCardProps) {
	
	const [hp] = useState(Character.getHp(char));
	const [recoveries] = useState(Character.getRecoveries(char));
	
	return (
		<>
			<Card className={'character-card'} style={{width: '15rem'}}>
				<div style={{position: 'relative'}}>
					<Card.Img variant={'top'} src={char.pictureUrl} />
					<div style={{position: 'absolute', width: '100%', bottom: '0px'}}>
						<div>
							<Table className={'character-card-table'}>
								<tbody>
								<tr>
									<td>M 2</td>
									<td>A 0</td>
									<td>R 1</td>
									<td>I 1</td>
									<td>P 0</td>
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
}