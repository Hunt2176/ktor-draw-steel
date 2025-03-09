import { Carousel } from "@mantine/carousel";
import { BackgroundImage, Box, Burger, Drawer, Flex, Image, Stack, Title, Text, Anchor, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { EmblaCarouselType } from "embla-carousel";
import { useCampaign } from "hooks/api_hooks.ts";
import { Fragment, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { parseIntOrUndefined } from "utils.ts";

export interface DisplayPageProps {}

export function DisplayPage({}: DisplayPageProps) {
	const navigate = useNavigate();
	const params = useParams();
	
	const [drawerOpen, drawerOpenHandlers] = useDisclosure(false);
	const [embla, setEmbla] = useState<EmblaCarouselType>();
	
	const { id } = params;
	const campaignId = parseIntOrUndefined(id);
	
	if (campaignId == null || isNaN(campaignId)) {
		navigate('/campaigns');
		return <></>;
	}
	
	const campaignResult = useCampaign(campaignId);
	const { data: campaign } = campaignResult;
	
	if (!campaignResult.isFetching && !campaign) {
		navigate('/campaigns');
	}
	
	const items = useMemo(() => {
		if (!campaign) {
			return [];
		}
		
		return campaign.entries.map((entry) => {
			let el = <>
				<Stack h={'100%'} justify={entry.type === 'Portrait' ? 'start' : 'end'}>
					<Title ta={'center'} size={'h1'}>
						{entry.title}
					</Title>
					{entry.description
						? <>
							<Title mah={entry.type === 'Background' ? '40%' : undefined} style={{ overflow: 'auto', whiteSpace: 'pre-wrap' }} ta={'center'} size={'h2'}>
								{entry.description}
							</Title>
						</>
						: <></>
					}
				</Stack>
			</>;
			
			if (entry.pictureUrl) {
				switch (entry.type) {
					case 'Background': {
						el = <>
							<BackgroundImage h={'100%'} src={entry.pictureUrl}>
								<Flex direction={'column'}
								      h={'100%'}
								      justify={'end'}
								      align={'center'}
								      pb={'xs'}>
									{el}
								</Flex>
							</BackgroundImage>
						</>
						
						break;
					}
					case 'Portrait': {
						el = <>
							<Box>
								<Box h={'60cqh'}>
									<Flex h={'100%'} justify={'center'} align={'center'}>
										<Image h={'100%'} fit={'contain'} radius={25} src={entry.pictureUrl}/>
									</Flex>
								</Box>
								<Box h={'40cqh'}>
									{el}
								</Box>
							</Box>
						</>;
					}
				}
			}
			
			return <Fragment key={entry.id}>
				<Carousel.Slide>
					<Box p={entry.type === 'Portrait' ? 'xs' : undefined} h={'100%'} style={{'containerType': 'size'}}>
						{el}
					</Box>
				</Carousel.Slide>
			</Fragment>;
		});
		
	}, [campaign]);
	
	const drawer = useMemo(() => {
		if (!campaign) {
			return <></>;
		}
		
		function scrollTo(index: number) {
			embla?.scrollTo(index, true);
			drawerOpenHandlers.close();
		}
		
		return <>
			<Drawer title={<Text>{campaign.campaign.name}</Text>}
			        opened={drawerOpen}
			        onClose={drawerOpenHandlers.close}>
				<Stack>
					{ campaign.entries.map((e, idx) => {
						return <Fragment key={e.id}>
							<Button onClick={() => scrollTo(idx)} disabled={embla == null}>
								<Text>{e.title}</Text>
							</Button>
						</Fragment>
					})}
				</Stack>
			</Drawer>
		</>;
	}, [campaign, drawerOpen, embla]);
	
	if (!campaign) {
		return <>
			<Flex h={'100%'} justify={'center'} align={'center'}>
				Loading...
			</Flex>
			</>;
	}
	
	return <>
		{drawer}
		<Box pos={'absolute'} style={{'zIndex': '100'}}>
			<Box m={'xs'}>
				<Burger opened={drawerOpen} onClick={drawerOpenHandlers.toggle}></Burger>
			</Box>
		</Box>
		<Flex h={'100%'}>
			<Carousel getEmblaApi={setEmbla} height={'100%'} style={{ flex: 1 }}>
				{items}
			</Carousel>
		</Flex>
	</>;
}