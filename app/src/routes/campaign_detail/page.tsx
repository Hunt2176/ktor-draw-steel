import { faFile, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Fragment, useContext, useMemo, useRef, useState } from "react";
import { Button, Card, CardTitle, Image, Modal, Navbar, NavbarText } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { CharacterSelector } from "src/components/character_selector/character_selector.tsx";
import { UploadModal } from "src/components/upload-modal.tsx";
import { useCampaign, useCombatsForCampaign, useWatchCampaign } from "src/hooks/api_hooks.ts";
import { CharacterCard } from "src/components/character_card/card.tsx";
import { CharacterEditor } from "src/components/character_editor/character_editor.tsx";
import { createCharacter, createCombat, CreateCombatUpdate, deleteCombat, updateCampaign } from "src/services/api.ts";
import { ErrorContext } from "src/services/contexts.ts";
import { Character, Combat } from "src/types/models.ts";
import Element = React.JSX.Element;

export function CampaignDetail() {
	const queryClient = useQueryClient();
	
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
	const campaign = useCampaign(id);
	const combats = useCombatsForCampaign(campaign?.campaign.id);
	
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
		
		return <Modal show={newCharacter} onHide={() => setNewCharacter(false)}>
			<Modal.Header closeButton>
				<Modal.Title>New Character</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<CharacterEditor character={model} onSubmit={saveCharacterMutation.mutateAsync}></CharacterEditor>
			</Modal.Body>
		</Modal>;
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
			<Modal show={newCombat}
			       onShow={() => combatSelected.current = {}}
			       onHide={() => setNewCombat(false)}>
				<Modal.Header>
					<Modal.Title>New Combat</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<CharacterSelector onChange={(e) => combatSelected.current = e}
					                   characters={campaign.characters}/>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setNewCombat(false)}>Cancel</Button>
					<Button disabled={createCombatMutation.isPending} onClick={() => onCreate()}>Create</Button>
				</Modal.Footer>
			</Modal>
		</>;
	}, [campaign, newCombat, createCombatMutation]);
	
	const deleteCombatModal = useMemo(() => {
		return <>
			<Modal show={!!combatToDelete}>
				<Modal.Header>
					<Modal.Title>Delete Combat</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					Are you sure you want to delete this combat?
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setCombatToDelete(null)}>Cancel</Button>
					<Button variant="danger" onClick={() => {
						if (combatToDelete) {
							deleteCombatMutation.mutate(combatToDelete.id);
						}
					}}>Delete</Button>
				</Modal.Footer>
			</Modal>
		</>
	}, [combatToDelete, deleteCombatMutation]);
	
	const combatElements = useMemo(() => {
		return <>
			<div>
				<div className="d-flex align-items-center mb-2">
					<h3 className="m-0">Combats</h3>
					<Button size="sm"
					        className="ms-2"
					        onClick={() => setNewCombat(true)}>
						<FontAwesomeIcon icon={faPlus}/>
					</Button>
				</div>
				{combats.map((combat) => {
					return <Fragment key={combat.id}>
						<div className="w-50">
							<Card>
								<CardTitle className="d-flex justify-content-between m-2">
									Round: {combat.round}
									<div className="d-flex flex-column justify-content-center">
										<Button className="mb-2" onClick={() => navigate(`/combats/${combat.id}`)}>
											View
										</Button>
										<Button variant="danger" onClick={() => setCombatToDelete(combat)}>
											Delete
										</Button>
									</div>
								</CardTitle>
							</Card>
						</div>
					</Fragment>
				})}
			</div>
		</>;
	}, [combats, navigate]);
	
	const characterElements = useMemo(() => {
		return campaign && campaign.characters.reduce((acc, character, index) => {
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
				<div className={'d-flex flex-column flex-1'} key={index}>
					{row.map((el) => (el))}
				</div>
			));
	}, [campaign, navigate]);
	
	const campaignDisplay = useMemo(() => (
		campaign &&
	    <div className={'d-flex flex-column vh-100'}>
	      <div className={'flex-1'}>
          <Navbar>
		          <div className="d-flex justify-content-between w-100">
	              <NavbarText>{campaign.campaign.name}</NavbarText>
			          <Button onClick={() => setShowBackgroundUpload(true)} variant={'outline-info'}>
					          <FontAwesomeIcon icon={faFile} />
			          </Button>
		          </div>
          </Navbar>
	      </div>
	      <div className={'flex-2'}>
		      {combatElements}
	      </div>
	      <div className={'flex-3 d-flex flex-column flex-wrap'}>
			      <div className={'d-flex justify-content-center my-2'}>
				      <Button onClick={() => setNewCharacter(true)}>Add Character</Button>
			      </div>
	          <div className={'d-flex'}>
							{characterElements?.map((row) => (
								row
							))}
	          </div>
	      </div>
	    </div>
	), [campaign, characterElements, combatElements]);
	
	if (campaign) {
		return (
			<>
				<UploadModal show={showBackgroundUpload}
				             accept=".png,.jpg,.jpeg,.webp"
				             onHide={() => setShowBackgroundUpload(false)}
				             onComplete={(e) => updateCampaignBackgroundMutation.mutate(e ? `/files/${e}` : undefined)}>
					{(file) => {
						if (file == null) return <></>;
						return <Image style={{width: '100%', objectFit: 'contain'}} src={URL.createObjectURL(file)} thumbnail/>;
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