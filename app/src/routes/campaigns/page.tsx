import { ReactNode, useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
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
									<tr>
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

async function fetchCampaigns(): Promise<Campaign[]> {
	const res = await fetch('/api/campaigns')
	return (await res.json()) as Campaign[]
}