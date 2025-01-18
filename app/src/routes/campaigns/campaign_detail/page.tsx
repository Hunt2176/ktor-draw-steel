import { useNavigate, useParams } from "react-router-dom";
import { Clickable } from "src/components/utility.tsx";
import { useCampaign } from "src/hooks/api_hooks.ts";
import { usePromise } from "src/hooks/promise_hook.ts";
import { CharacterCard } from "src/routes/characters/character_card/card.tsx";

export function CampaignDetail() {
	const params = useParams();
	const navigate = useNavigate();
	const id = parseInt(params.id as string);
	if (isNaN(id) || id == null) {
		console.error(`Invalid campaign ${id}`);
		navigate('/');
		return <></>;
	}
	
	const campaignPromise = useCampaign(id);
	const {value: campaign, error, loading} = usePromise(campaignPromise);
	
	if (loading) {
		return <p>Loading...</p>;
	}
	if (error) {
		return <p>Error: {error}</p>;
	}
	
	if (campaign) {
		return <>
			<h1>{campaign.campaign.name}</h1>
			{campaign.characters.map(c => (
				<Clickable onClick={() => navigate(`/characters/${c.id}`)} key={c.id}>
					<CharacterCard character={c} type={'tile'}></CharacterCard>
				</Clickable>
			))}
		</>
	}
}