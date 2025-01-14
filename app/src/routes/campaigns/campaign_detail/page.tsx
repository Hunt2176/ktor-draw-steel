import { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { Case, Switch } from "src/components/switch.tsx";
import { Campaign, Character } from "src/types/models.ts";

export function CampaignDetail() {
	const params = useParams();
	const [id] = useState(() => {
		try {
			return parseInt(params.id as string);
		} catch (e) {
			return null;
		}
	});
	
	const [campaignDetails, setCampaignDetails] = useState<CampaignDetails>();
	
	useEffect(() => {
		if (typeof id !== 'number') {
			return;
		}
		
		(async () => {
			const campaignDetails = await fetchCampaign(id);
			setCampaignDetails(campaignDetails);
		})();
	}, [id]);
	
	return <>
		<h1>Campaign Detail</h1>
		<Switch>
			<Case when={id == null}>
				<p>Invalid Id</p>
			</Case>
			<Case when={campaignDetails == null}>
				<p>Loading...</p>
			</Case>
			<Case when={!!campaignDetails}>
				<>
					<h2>{campaignDetails?.campaign.name}</h2>
					<h3>Characters</h3>
					<Table>
						<tbody>
							{campaignDetails?.characters.map((character) => (
								<tr key={character.id}>
									<td>{character.name}</td>
								</tr>
							))}
						</tbody>
					</Table>
				</>
			</Case>
		</Switch>
		{ (campaignDetails == null) ? <p>Invalid Id</p> : <></> }
	</>
}

async function fetchCampaign(id: number): Promise<CampaignDetails> {
	const campaignResp = await fetch(`/api/campaigns/${id}`);
	const campaign = await campaignResp.json() as Campaign;
	
	const characterResp = await fetch(`/api/campaigns/${id}/characters`);
	const characters = await characterResp.json() as Character[];
	return { campaign, characters };
}

type CampaignDetails = { campaign: Campaign, characters: Character[] };