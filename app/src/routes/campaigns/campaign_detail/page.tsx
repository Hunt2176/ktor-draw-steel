import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clickable } from "src/components/utility.tsx";
import { Case, Switch } from "src/components/visibility.tsx";
import { CharacterCard } from "src/routes/characters/character_card/card.tsx";
import { CampaignDetails, fetchCampaign } from "src/services/api.ts";

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
	const navigate = useNavigate();
	
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
				{ () =>
					<>
						<h2>{campaignDetails?.campaign.name}</h2>
						<h3>Characters</h3>
						{
							campaignDetails?.characters.map((char) => (
								<Clickable onClick={() => navigate(`/characters/${char.id}`)}>
									<CharacterCard key={char.id} character={char} type={'tile'}></CharacterCard>
								</Clickable>
							))
						}
					</>
				}
			</Case>
		</Switch>
		{ (campaignDetails == null) ? <p>Invalid Id</p> : <></> }
	</>
}