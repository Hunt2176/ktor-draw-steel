import { useEffect, useState } from "react";
import { Campaign } from "src/types/models";

export function useCampaignBackground(campaign: Campaign | undefined) {
	
	useEffect(() => {
		const body = document.querySelector('#root') as HTMLBodyElement;
		const background = campaign?.background;
		if (background) {
			body.style.backgroundImage = `url(${background})`;
			body.style.backgroundRepeat = 'no-repeat';
			body.style.backgroundSize = 'cover';
		} else {
			body.style.background = '';
		}
	}, [campaign]);
}