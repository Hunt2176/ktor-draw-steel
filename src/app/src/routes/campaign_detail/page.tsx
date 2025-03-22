import { faBook, faImage, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Fragment, useContext, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Anchored } from "components/anchored.tsx";
import { CharacterSelector } from "components/character_selector/character_selector.tsx";
import { UploadModal } from "components/upload-modal.tsx";
import { useCampaign, useCombatsForCampaign, useWatchCampaign } from "hooks/api_hooks.ts";
import { CharacterCard } from "components/character_card/card.tsx";
import { CharacterEditor } from "components/character_editor/character_editor.tsx";
import { createCharacter, createCombat, CreateCombatUpdate, deleteCombat, updateCampaign } from "services/api.ts";
import { ErrorContext } from "services/contexts.ts";
import { Character, Combat } from "types/models.ts";
import { ActionIcon, Button, Card, Flex, Modal, Image, Title, Stack, Group, Divider, useModalsStack } from "@mantine/core";
import Element = React.JSX.Element;

export function CampaignDetail() {
	const queryClient = useQueryClient();
	
	const stack = useModalsStack(['character-editor', 'upload-modal']);
	
	const [newCharacter, setNewCharacter] = useState(false);
	const [newCombat, setNewCombat] = useState(false);
	const [combatToDelete, setCombatToDelete] = useState<Combat | null>(null);
	
	const [showBackgroundUpload, setShowBackgroundUpload] = useState(false);
	
	const combatSelected = useRef<Record<number, boolean>>({});
	
	const [_, setError] = useContext(ErrorContext);
	
	const params = useParams();
	const navigate = useNavigate();
	const id = parseInt(params.id as string);
	if (isNaN(id) || id == null) {
		console.error(`Invalid campaign ${id}`);
		navigate('/');
		return <></>;
	}
	
	useWatchCampaign(id);
	const { data: campaign } = useCampaign(id);
	const { data: combats } = useCombatsForCampaign(campaign?.campaign.id);
	
	const updateCampaignBackgroundMutation = useMutation({
		mutationFn: (url?: string) => {
			return updateCampaign(id, { background: url });
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['campaign', id]
			});
			setShowBackgroundUpload(false);
		},
	});
	
	const deleteCombatMutation = useMutation({
		mutationFn: (id: number) => {
			return deleteCombat(id);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['combat', id]
			});
			
			await queryClient.invalidateQueries({
				queryKey: ['combats', id]
			});
			
			setCombatToDelete(null);
		}
	});
	
	const saveCharacterMutation = useMutation({
		mutationFn: (character: Partial<Character>) => {
			character.campaign = id;
			character.user = 1;
			
			return createCharacter(character);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['campaign', id]
			});
			
			setNewCharacter(false);
		},
		onError: setError
	})
	
	const createCombatMutation = useMutation({
		mutationFn: (update: CreateCombatUpdate) => {
			return createCombat(update);
		},
		onSuccess: async (data) => {
			setNewCombat(false);
			await queryClient.invalidateQueries({
				queryKey: ['combats', id]
			});
			
			navigate(`/combats/${data.id}`);
		},
	});
	
	
	
	const newCharacterModal = useMemo(() => {
		const model = Character.new();
		
		return (
			<Modal.Stack>
				<Modal stackId={'character-editor'} opened={newCharacter} title={'New Character'} onClose={() => setNewCharacter(false)}>
					<CharacterEditor uploadStackId={'upload-modal'} character={model} onSubmit={saveCharacterMutation.mutateAsync}></CharacterEditor>
				</Modal>
			</Modal.Stack>
		);
	}, [newCharacter, saveCharacterMutation.mutateAsync]);
	
	const newCombatModal = useMemo(() => {
		if (!campaign) {
			return <></>;
		}
		
		const onCreate = () => {
			const selected = Object.entries(combatSelected.current)
				.filter(([, value]) => value)
				.map(([key]) => parseInt(key));
			
			createCombatMutation.mutate({
				campaign: campaign.campaign.id,
				characters: selected
			});
		}
		
		return <>
			<Modal title={'New Combat'}
				     opened={newCombat}
			       onEnterTransitionEnd={() => combatSelected.current = {}}
			       onClose={() => setNewCombat(false)}>
				<Stack>
					<div>
						<CharacterSelector onChange={(e) => combatSelected.current = e}
						                   characters={campaign.characters}/>
					</div>
					
					<Divider my={2}/>
					<Group justify={'end'}>
						<Button color="gray" onClick={() => setNewCombat(false)}>Cancel</Button>
						<Button disabled={createCombatMutation.isPending} onClick={() => onCreate()}>Create</Button>
					</Group>
				</Stack>
				
			</Modal>
		</>;
	}, [campaign, newCombat, createCombatMutation]);
	
	const deleteCombatModal = useMemo(() => {
		return <>
			<Modal title={'Delete Combat'}
			       opened={!!combatToDelete}
			       onClose={() => setCombatToDelete(null)}>
				<Stack>
					Are you sure you want to delete this combat?
					<Divider my={2}/>
					<Group justify={'end'}>
						<Button color="gray" onClick={() => setCombatToDelete(null)}>Cancel</Button>
						<Button color="red" onClick={() => {
							if (combatToDelete) {
								deleteCombatMutation.mutate(combatToDelete.id);
							}
						}}>Delete</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	}, [combatToDelete, deleteCombatMutation]);
	
	const combatElements = useMemo(() => {
		return <>
			<Stack>
				<Anchored position={'left'}>
					<Title display={'inline-block'} pr={8} order={3}>Combats</Title>
					<ActionIcon onClick={() => setNewCombat(true)}>
						<FontAwesomeIcon icon={faPlus}/>
					</ActionIcon>
				</Anchored>
				<Flex>
					{combats?.map((combat) => {
						return (
							<Fragment key={combat.id}>
								<Card w={'50%'}>
									<Flex justify={'space-between'} m={2}>
										<Title order={3}>
											Round: {combat.round}
										</Title>
										<Flex direction={'column'} justify={'center'}>
											<Button mb={2} onClick={() => navigate(`/combats/${combat.id}`)}>
												View
											</Button>
											<Button color="red" onClick={() => setCombatToDelete(combat)}>
												Delete
											</Button>
										</Flex>
									</Flex>
								</Card>
							</Fragment>
						)
					})}
				</Flex>
			</Stack>
		</>;
	}, [combats, navigate]);
	
	const characterElements = useMemo(() => {
		return campaign && campaign.characters.reduce((acc, character, index) => {
			if (character.offstage) {
				return acc;
			}
			
			const characterEl = (
				<CharacterCard onPortraitClick={() => navigate(`/characters/${character.id}`)} key={character.id} character={character} type={'tile'}/>
			)
			
			if (index % 5 == 0) {
				acc.push([characterEl]);
			}
			else {
				acc[acc.length - 1].push(characterEl);
			}
			
			return acc;
		}, new Array<Element[]>())
			.map((row, index) => (
				<Stack key={index}>
					{row.map((el) => (el))}
				</Stack>
			));
	}, [campaign, navigate]);
	
	const campaignDisplay = useMemo(() => (
		campaign &&
	    <Stack>
	      <Flex flex={1}>
          <Anchored position={'left'}>
	          <Group>
	            <Title display={'inline-block'} pr={8} order={2}>{campaign.campaign.name}</Title>
		          <ActionIcon variant={'outline'} onClick={() => navigate(`/campaigns/${campaign.campaign.id}/display`)}>
			          <FontAwesomeIcon icon={faBook} />
		          </ActionIcon>
		          <ActionIcon variant={'outline'} onClick={() => setShowBackgroundUpload(true)}>
				          <FontAwesomeIcon icon={faImage} />
		          </ActionIcon>
	          </Group>
          </Anchored>
	      </Flex>
	      {combatElements}
	      <Stack flex={3}>
		      <Anchored position={'left'}>
			      <Title display={'inline-block'} pr={8} order={3}>Characters</Title>
			      <ActionIcon onClick={() => setNewCharacter(true)}>
					      <FontAwesomeIcon icon={faPlus} />
			      </ActionIcon>
		      </Anchored>
          <Group align={'start'}>
						{characterElements?.map((row) => (
							row
						))}
          </Group>
	      </Stack>
	    </Stack>
	), [campaign, characterElements, combatElements, navigate]);
	
	if (campaign) {
		return (
			<>
				<UploadModal show={showBackgroundUpload}
				             accept=".png,.jpg,.jpeg,.webp"
				             onHide={() => setShowBackgroundUpload(false)}
				             onComplete={(e) => updateCampaignBackgroundMutation.mutate(e ? `/files/${e}` : undefined)}>
					{(file) => {
						if (file == null) return <></>;
						return <Image fit={'contain'} src={URL.createObjectURL(file)}/>;
					}}
				</UploadModal>
				{deleteCombatModal}
				{newCombatModal}
				{newCharacterModal}
				{campaignDisplay}
			</>
		);
	}
}