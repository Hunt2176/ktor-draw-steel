import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Carousel } from "@mantine/carousel";
import { BackgroundImage, Box, Burger, Drawer, Flex, Image, Stack, Title, Text, Button, Modal, Divider, Group, Grid, Popover } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArkErrors } from "arktype";
import { DisplayEntryEditor, DisplayEntryEditorUpdate } from "components/display_entry_editor.tsx";
import { EmblaCarouselType } from "embla-carousel";
import { useCampaign, useWatchCampaign } from "hooks/api_hooks.ts";
import { Fragment, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createDisplayEntry, deleteDisplayEntry, uploadFile } from "services/api.ts";
import { parseIntOrUndefined } from "utils.ts";

export interface DisplayPageProps {}

export function DisplayPage({}: DisplayPageProps) {
	const navigate = useNavigate();
	const params = useParams();
	const queryClient = useQueryClient();
	
	const [drawerOpen, drawerOpenHandlers] = useDisclosure(false);
	const [editModalOpen, editModalOpenHandlers] = useDisclosure(false);
	const [embla, setEmbla] = useState<EmblaCarouselType>();
	const [openedDeleteId, setOpenedDeleteId] = useState<number>();
	
	const [editorState, setEditorState] = useState<DisplayEntryEditorUpdate | ArkErrors>();
	
	const { id } = params;
	const campaignId = parseIntOrUndefined(id);
	
	if (campaignId == null || isNaN(campaignId)) {
		navigate('/campaigns');
		return <></>;
	}
	
	useWatchCampaign(campaignId);
	
	const createEntryMutation = useMutation({
		mutationFn: async (entry: DisplayEntryEditorUpdate) => {
			const file = entry.file;
			let fileUrl: string | null = null;
			if (file != null) {
				const fileResult = await uploadFile(file);
				fileUrl = '/files/' + fileResult.fileName;
			}
			
			return createDisplayEntry({
				title: entry.title,
				description: entry.description ?? null,
				type: entry.type,
				pictureUrl: fileUrl,
				campaign: campaignId,
			});
		},
		onSuccess: () => {
			editModalOpenHandlers.close();
			return queryClient.invalidateQueries({
				queryKey: ['campaign', campaignId],
			})
		}
	});
	
	const deleteEntryMutation = useMutation({
		mutationFn: async (id: number) => {
			return await deleteDisplayEntry(id);
		},
		onSuccess: () => {
			return queryClient.invalidateQueries({
				queryKey: ['campaign', campaignId],
			})
		}
	});
	
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
										<Image w={'auto'} h={'100%'} fit={'contain'} radius={25} src={entry.pictureUrl}/>
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
		
		function closeDelete(id: number) {
			if (openedDeleteId === id) {
				setOpenedDeleteId(undefined);
			}
		}
		
		return <>
			<Drawer title={
				<Button onClick={() => navigate(`/campaigns/${campaignId}`)}
				        variant={'transparent'}>
					<Title>
						{campaign.campaign.name}
					</Title>
				</Button>}
			        opened={drawerOpen}
			        onClose={drawerOpenHandlers.close}>
				<Flex mb={'xs'} justify={'end'}>
					<Button variant={'transparent'} size={'compact-xs'} color={'green'} onClick={editModalOpenHandlers.open}>
						<FontAwesomeIcon icon={faPlus} />
						<Text>Add Entry</Text>
					</Button>
				</Flex>
				<Stack>
					{ campaign.entries.map((e, idx) => {
						return <Fragment key={e.id}>
							<Grid align={'center'}>
								<Grid.Col span={10}>
									<Button w={'100%'} variant={'outline'} onClick={() => scrollTo(idx)} disabled={embla == null}>
										<Text>{e.title}</Text>
									</Button>
								</Grid.Col>
								<Grid.Col span={2}>
									<Popover withArrow
									         opened={openedDeleteId === e.id}
									         onChange={(opened) => {
														 if (opened) {
															 setOpenedDeleteId(e.id);
														 } else {
															 closeDelete(e.id);
														 }
									         }}>
										<Popover.Target>
											<Button color={'red'} onClick={() => setOpenedDeleteId(e.id)}>
												<FontAwesomeIcon icon={faTrash}/>
											</Button>
										</Popover.Target>
										<Popover.Dropdown>
											<Text size={'md'}>
												Are you sure you want to delete this entry?
											</Text>
											<Divider orientation={'vertical'}/>
											<Group justify={'end'} gap={'xs'}>
												<Button mt={'xs'} color={'gray'} onClick={() => closeDelete(e.id)}>
													Cancel
												</Button>
												<Button mt={'xs'} color={'red'} onClick={() => deleteEntryMutation.mutate(e.id)}>
													Delete
												</Button>
											</Group>
										</Popover.Dropdown>
									</Popover>
								</Grid.Col>
							</Grid>
						</Fragment>
					})}
				</Stack>
			</Drawer>
		</>;
	}, [campaign, drawerOpen, embla, editModalOpenHandlers.open, navigate, openedDeleteId, deleteEntryMutation]);
	
	if (!campaign) {
		return <>
			<Flex h={'100%'} justify={'center'} align={'center'}>
				Loading...
			</Flex>
		</>;
	}
	
	return <>
		{drawer}
		<Modal opened={editModalOpen} onClose={editModalOpenHandlers.close}>
			<DisplayEntryEditor onChange={setEditorState} />
			<Divider my={'xs'} />
			{ editorState instanceof ArkErrors
				? <Text>{editorState.map(e => e.message).join('')}</Text>
				: <></>
			}
			<Group justify={'end'}>
				<Button disabled={editorState == null || editorState instanceof ArkErrors} color={'green'} onClick={() => createEntryMutation.mutate(editorState as any)}>
					Save
				</Button>
			</Group>
		</Modal>
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