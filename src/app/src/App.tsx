import 'App.scss'
import '@mantine/core/styles.css';

import { Card, ColorSchemeScript, createTheme, MantineProvider, Modal, Popover, useMantineColorScheme } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { CampaignDetail } from "routes/campaign_detail/page.tsx";
import { CampaignPage } from "routes/campaigns/page.tsx";
import { CharacterPage } from "routes/characters/page.tsx";
import { CombatPage } from "routes/combat/page.tsx";
import { HomePage } from "routes/home/page.tsx";
import { ErrorContext } from "services/contexts.ts";

const queryClient = new QueryClient();

const App = () => {
	const errorController = useState<Object | unknown | undefined>();
	
	const theme = createTheme({
		components: {
			Card: Card.extend({
				classNames: {
					root: 'blur'
				}
			}),
			Popover: Popover.extend({
				classNames: {
					dropdown: 'blur'
				}
			})
		}
	});
	
	return <>
		<ColorSchemeScript defaultColorScheme={'dark'}/>
		<MantineProvider defaultColorScheme={'dark'} theme={theme}>
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