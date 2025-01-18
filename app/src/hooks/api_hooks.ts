import { useContext, useMemo } from "react";
import { CampaignDetails, fetchCampaign, fetchCharacter } from "src/services/api.ts";
import { CampaignContext, CharacterContext } from "src/services/contexts.ts";
import { Character } from "src/types/models.ts";

export function useCharacter(id: number): Promise<Character | undefined> {
	const [character, setCharacter] = useContext(CharacterContext);
	const [campaign] = useContext(CampaignContext);
	
	return useMemo(async () => {
		const foundFromCampaign = campaign?.characters.find((c) => c.id == id);
		if (character?.id == id) {
			setCharacter(character);
			return character;
		}
		else if (foundFromCampaign != null) {
			setCharacter(foundFromCampaign);
			return foundFromCampaign;
		}
		else  {
			try {
				const c = await fetchCharacter(id);
				setCharacter(c);
				return c;
			} catch {
				setCharacter(undefined);
				return undefined;
			}
		}
	}, [id]);
}

export function useCampaign(id: number): Promise<CampaignDetails | undefined> {
	const [campaignDetails, setCampaignDetails] = useContext(CampaignContext);
	
	return useMemo(async () => {
		if (campaignDetails == null || campaignDetails.campaign.id != id) {
			try {
				const c = await fetchCampaign(id);
				setCampaignDetails(c);
				return c;
			} catch {
				setCampaignDetails(undefined);
				return undefined;
			}
		}
		
		return campaignDetails;
	}, [id]);
}