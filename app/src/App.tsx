import 'src/App.scss'
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { CampaignDetail } from "src/routes/campaigns/campaign_detail/page.tsx";
import { CampaignPage } from "src/routes/campaigns/page.tsx";
import { CharacterEditorPage } from "src/routes/characters/character_editor/page.tsx";
import { CharacterPage } from "src/routes/characters/page.tsx";
import { HomePage } from "src/routes/home/page.tsx";
import { CampaignDetails } from "src/services/api.ts";
import { CampaignContext, CharacterContext } from "src/services/contexts.ts";
import { Character } from "src/types/models.ts";

const App = () => {
	const campaignController = useState<CampaignDetails>();
	const characterController = useState<Character>();
	
	return <>
		<CampaignContext.Provider value={campaignController}>
			<CharacterContext.Provider value={characterController}>
				<RouterEl/>
			</CharacterContext.Provider>
		</CampaignContext.Provider>
	</>;
}

const RouterEl = () => {
	return (
				<Router>
					<Routes>
						<Route path="/" element={<HomePage/>}></Route>
						<Route path="/campaigns" element={<CampaignPage/>}></Route>
						<Route path="/campaigns/:id" element={<CampaignDetail/>}></Route>
						<Route path="/campaigns/:id/characters" element={<CharacterPage/>}></Route>
						<Route path="/characters/:id" element={<CharacterPage/>}></Route>
						<Route path="/characters/:id/edit" element={<CharacterEditorPage/>}></Route>
					</Routes>
				</Router>
	)
}

createRoot(document.getElementById('root')!)
	.render(<App/>);
