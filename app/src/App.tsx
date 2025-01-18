import 'src/App.scss'
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from "react";
import { CloseButton, Modal } from "react-bootstrap";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { CampaignDetail } from "src/routes/campaigns/campaign_detail/page.tsx";
import { CampaignPage } from "src/routes/campaigns/page.tsx";
import { CharacterPage } from "src/routes/characters/page.tsx";
import { HomePage } from "src/routes/home/page.tsx";
import { CampaignContext, CharacterContext, ErrorContext } from "src/services/contexts.ts";
import { CampaignDetails, Character } from "src/types/models.ts";

const App = () => {
	const campaignController = useState<CampaignDetails>();
	const characterController = useState<Character>();
	const errorController = useState<Object | unknown | undefined>()
	
	return <>
		<ErrorContext.Provider value={errorController}>
			<Modal show={errorController[0] != null}>
				<Modal.Header>
					<Modal.Title>Error</Modal.Title>
					<CloseButton onClick={() => errorController[1](undefined)}></CloseButton>
				</Modal.Header>
				<Modal.Body>{errorController[0]?.toString()}</Modal.Body>
			</Modal>
			<CampaignContext.Provider value={campaignController}>
				<CharacterContext.Provider value={characterController}>
					<RouterEl/>
				</CharacterContext.Provider>
			</CampaignContext.Provider>
		</ErrorContext.Provider>
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
					</Routes>
				</Router>
	)
}

createRoot(document.getElementById('root')!)
	.render(<App/>);
