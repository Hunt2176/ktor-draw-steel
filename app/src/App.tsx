import 'src/App.scss'
import 'bootstrap/dist/css/bootstrap.min.css';
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { CampaignDetail } from "src/routes/campaigns/campaign_detail/page.tsx";
import { CampaignPage } from "src/routes/campaigns/page.tsx";
import { CharacterPage } from "src/routes/characters/page.tsx";
import { HomePage } from "src/routes/home/page.tsx";

const App = () => {
	return <>
		<RouterEl/>
	</>;
}

const RouterEl = () => {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<HomePage/>}></Route>
				<Route path="/campaigns/:id" element={<CampaignDetail/>}></Route>
				<Route path="/campaigns/:id" element={<CampaignDetail/>}></Route>
				<Route path="/campaigns" element={<CampaignPage/>}></Route>
				<Route path="/character/:id" element={<CharacterPage/>}></Route>
				<Route path="/character/:id/edit" element={<CharacterPage/>}></Route>
			</Routes>
		</Router>
	)
}

createRoot(document.getElementById('root')!)
	.render(<App/>);
