import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCampaignList } from "src/hooks/api_hooks.ts";
import { usePromise } from "src/hooks/promise_hook.ts";
import { CampaignContext } from "src/services/contexts.ts";
import { CampaignDetails } from "src/types/models.ts";

export function CampaignPage() {
	const [_, setCampaign] = useContext(CampaignContext);
	
	const navigator = useNavigate();
	const campaignsPromise = useCampaignList();
	const { value: campaigns, error, loading } = usePromise(campaignsPromise);
	
	function selectCampaign(details: CampaignDetails) {
		setCampaign(details);
		navigator(`/campaigns/${details.campaign.id}`);
	}
	
	if (loading) {
		return <div>Loading...</div>;
	}
	if (error != null) {
		return <div>Error: {error.message}</div>;
	}
	if (campaigns != null) {
		return (
			<div>
				<h1>Campaigns</h1>
				{campaigns.map((details) => (
					<div key={details.campaign.id}>
						<button
							onClick={() => selectCampaign(details)}
						>{details.campaign.name}</button>
					</div>
				))}
			</div>
		);
	}
}