import { Button, Table } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useCampaignList } from "hooks/api_hooks.ts";
import { CampaignDetails } from "types/models.ts";

export function CampaignPage() {
	const navigator = useNavigate();
	
	const campaigns = useCampaignList();
	
	function selectCampaign(details: CampaignDetails) {
		navigator(`/campaigns/${details.campaign.id}`);
	}
	
	if (campaigns != null) {
		return (
			<div>
				<h1>Campaigns</h1>
				<Table>
					<tbody>
						{campaigns.map((details) => (
							<tr key={details.campaign.id}>
								<td>
									<Button
										onClick={() => selectCampaign(details)}>
										{details.campaign.name}
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</Table>
			</div>
		);
	}
}