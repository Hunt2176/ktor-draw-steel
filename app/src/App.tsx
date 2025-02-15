import 'src/App.scss'
import 'bootstrap/dist/css/bootstrap.min.css';
import '@mantine/core/styles.css';

import { Card, createTheme, MantineProvider, Modal } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { CampaignDetail } from "src/routes/campaign_detail/page.tsx";
import { CampaignPage } from "src/routes/campaigns/page.tsx";
import { CharacterPage } from "src/routes/characters/page.tsx";
import { CombatPage } from "src/routes/combat/page.tsx";
import { HomePage } from "src/routes/home/page.tsx";
import { CampaignContext, CharacterContext, ErrorContext } from "src/services/contexts.ts";
import { CampaignDetails, Character } from "src/types/models.ts";

const queryClient = new QueryClient();

const App = () => {
	const campaignController = useState<CampaignDetails>();
	const characterController = useState<Character>();
	const errorController = useState<Object | unknown | undefined>();
	
	const theme = createTheme({
		components: {
			Card: Card.extend({
				classNames: {
					root: 'blur'
				}
			})
		}
	});
	
	return <>
		<MantineProvider theme={theme}>
			<QueryClientProvider client={queryClient}>
				<ModalsProvider>
					<ErrorContext.Provider value={errorController}>
						<Modal title={'Error'}
						       opened={errorController[0] != null}
						       onClose={() => errorController[1](undefined)}>
							{errorController[0]?.toString()}
						</Modal>
						<Modal.Stack>
							<RouterEl/>
						</Modal.Stack>
					</ErrorContext.Provider>
				</ModalsProvider>
			</QueryClientProvider>
		</MantineProvider>
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
						<Route path="/combats/:id" element={<CombatPage/>}></Route>
					</Routes>
				</Router>
	)
}

createRoot(document.getElementById('root')!)
	.render(<App/>);