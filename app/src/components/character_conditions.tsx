import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ActionIcon, Button, Modal, Pill, Select, Stack, TextInput } from "@mantine/core";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { addCharacterCondition, CharacterConditionUpdate, deleteCharacterCondition } from "src/services/api.ts";
import { Character, CharacterCondition } from "src/types/models.ts";

export interface CharacterConditionsProps {
	character: Character
	editing?: boolean
}

export function CharacterConditions({ character }: CharacterConditionsProps) {
	const [showModal, modalHandles] = useDisclosure(false);
	const openModals = useRef(new Set<string>());
	
	const queryClient = useQueryClient();
	
	function closeAllModals() {
		openModals.current.forEach((modal) => {
			modals.close(modal);
		});
		openModals.current.clear();
	}
	
	useEffect(() => {
		return () => {
			closeAllModals();
		}
	}, []);
	
	const createConditionMutation = useMutation({
		mutationFn: (condition: CharacterConditionUpdate) => {
			return addCharacterCondition(condition);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['character', character.id] });
			modalHandles.close();
		}
	});
	
	const deleteConditionMutation = useMutation({
		mutationFn: (id: number) => {
			return deleteCharacterCondition(id);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['character', character.id] });
			closeAllModals();
		}
	});
	
	const deleteCallback = useCallback((condition: CharacterCondition) => {
		const id = modals.openConfirmModal({
			title: 'Remove Condition',
			children: `Are you sure you want to remove ${condition?.name} from ${character.name}?`,
			confirmProps: {
				color: 'red',
				children: 'Remove'
			},
			cancelProps: {
				children: 'Cancel'
			},
			onConfirm: () => {
				deleteConditionMutation.mutate(condition.id);
			}
		});
		
		openModals.current.add(id);
	}, [deleteConditionMutation, character.name]);
	
	return <>
		<Modal title={'Add Condition'} opened={showModal} onClose={modalHandles.close} trapFocus>
			<ConditionEditor character={character.id} onSubmit={createConditionMutation.mutate} />
		</Modal>
		
		<Pill.Group>
			{character.conditions.map((c) => {
				return <Pill key={c.id} c={'blue'} size={'md'} onRemove={() => deleteCallback(c)} withRemoveButton>{c.name}</Pill>
			})}
			<ActionIcon onClick={modalHandles.open}>
				<FontAwesomeIcon icon={faPlus} />
			</ActionIcon>
		</Pill.Group>
	</>;
}

interface ConditionEditorProps {
	character: number,
	onSubmit: (condition: CharacterConditionUpdate) => void
}

function ConditionEditor({ character, onSubmit }: ConditionEditorProps) {
	const [name, setName] = useInputState<string>('');
	const [type, setType] = useInputState<CharacterConditionUpdate['endType'] | string>('endOfTurn');
	
	const disabled = !name || (type != 'endOfTurn' && type != 'save');
	
	return (
		<Stack>
			<TextInput autoFocus={true} label={'Name'} value={name} onChange={setName} />
			<Select label={'End Type'} value={type} data={[
				{
					value: 'endOfTurn',
					label: 'End of Turn'
				},
				{
					value: 'save',
					label: 'Save'
				}
			]} onChange={setType}>
			
			</Select>
			<Button disabled={disabled} onClick={() => onSubmit({ name, character, endType: type as any })}>Submit</Button>
		</Stack>
	);
}