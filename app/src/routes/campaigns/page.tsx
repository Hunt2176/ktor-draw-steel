import { ReactNode, useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { CampaignDetails, fetchCampaigns } from "src/services/api.ts";
import { Campaign } from "src/types/models.ts";

export function CampaignPage(): ReactNode {
	const [campaigns, setCampaigns] = useState<Campaign[]>();
	const navigator = useNavigate();
	
	useEffect(() => {
		(async () => {
			const campaigns = await fetchCampaigns();
			setCampaigns(campaigns);
		})();
	}, [])
	
	//TODO: Make normal /api/campaigns also return characters
	function selectCampaign(details: CampaignDetails) {
	
	}
	
	return (
		<>
			{
				(campaigns == null)
					? <p>Loading...</p>
					: <>
						<h1>Campaigns</h1>
						<Table>
							<tbody>
								{campaigns.map((campaign) => (
									<tr key={campaign.id}>
										<td onClick={() => navigator(`/campaigns/${campaign.id}`)}>{campaign.name}</td>
									</tr>
								))}
							</tbody>
						</Table>
					</>
			}
		</>
	)
}