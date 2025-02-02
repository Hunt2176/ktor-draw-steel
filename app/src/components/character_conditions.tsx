import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge, Button, CloseButton, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from "react-bootstrap";
import { addCharacterCondition, CharacterConditionUpdate, deleteCharacterCondition } from "src/services/api.ts";
import { Character, CharacterCondition } from "src/types/models.ts";

export interface CharacterConditionsProps {
	character: Character
	editing?: boolean
}

export function CharacterConditions({ character, editing }: CharacterConditionsProps) {
	const [showModal, setShowModal] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState<CharacterCondition>();
	
	const queryClient = useQueryClient();
	
	const createConditionMutation = useMutation({
		mutationFn: (condition: CharacterConditionUpdate) => {
			return addCharacterCondition(condition);
		},
		onSuccess: async () => {
			setShowModal(false);
			await queryClient.invalidateQueries({ queryKey: ['character', character.id] });
		}
	});
	
	const deleteConditionMutation = useMutation({
		mutationFn: (id: number) => {
			return deleteCharacterCondition(id);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['character', character.id] });
			setConfirmDelete(undefined);
		}
	});
	
	const deleteModal = useMemo(() => {
		return <>
			<Modal show={!!confirmDelete} onHide={() => setConfirmDelete(undefined)}>
				<ModalHeader>
					<ModalTitle>Remove Condition</ModalTitle>
				</ModalHeader>
				<ModalBody>
					Are you sure you want to remove {confirmDelete?.name} from {character.name}?
				</ModalBody>
				<ModalFooter>
					<Button variant={'secondary'}
					        onClick={() => setConfirmDelete(undefined)}>Cancel</Button>
					<Button onClick={() => {
						deleteConditionMutation.mutate(confirmDelete!.id);
					}}>Delete</Button>
				</ModalFooter>
			</Modal>
		</>
	}, [confirmDelete, deleteConditionMutation, character.name]);
	
	const conditionEl = useMemo(() => {
		const cond = character.conditions.map((cond) => {
			return (
				<Badge onClick={() => editing && setConfirmDelete(cond)} className={`mx-1 ${editing ? 'clickable' : ''}`} key={cond.id}>
					{cond.name}
				</Badge>
			);
		});
		
		return (
			<div className="d-flex flex-wrap align-items-center h-100">
				{...cond}
			</div>
		);
	}, [character.conditions, editing]);
	
	const toRender = useMemo(() => {
		if (!editing) {
			return conditionEl;
		}
		
		return (
			<div className="row">
				<div className="col-10">
					{conditionEl}
				</div>
				<div className="col-2 d-flex justify-content-end">
					<Button onClick={() => setShowModal(true)}>
						<FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>
					</Button>
				</div>
			</div>
		);
	}, [conditionEl, editing]);
	
	const editModal = useMemo(() => {
		const obj: CharacterConditionUpdate = {
			name: '',
			character: character.id,
			endType: 'endOfTurn'
		};
		
		return <>
			<Modal show={showModal} onHide={() => setShowModal(false)}>
				<ModalHeader>
					<ModalTitle>Add Condition</ModalTitle>
					<CloseButton onClick={() => setShowModal(false)}></CloseButton>
				</ModalHeader>
				<ModalBody>
					<div className="row">
						<div className="col-12">
							<input type="text"
							       className="form-control"
							       placeholder="Condition Name"
							       onChange={(e) => obj.name = e.currentTarget.value}
							/>
						</div>
					</div>
					<div className="row mt-2">
						<div className="col-12">
							<select className="form-select"
							        onChange={(e) => obj.endType = e.currentTarget.value as any}>
								<option value={'endOfTurn'}>End of Turn</option>
								<option value={'save'}>Save</option>
							</select>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<div className="d-flex justify-content-end">
						<Button onClick={() => createConditionMutation.mutate(obj)}>Add</Button>
					</div>
				</ModalFooter>
			</Modal>
		</>
	}, [showModal, character.id, createConditionMutation]);
	
	return <>
		{editModal}
		{deleteModal}
		{toRender}
	</>;
}