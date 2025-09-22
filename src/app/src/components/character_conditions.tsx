import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ActionIcon, Button, FocusTrap, Modal, Pill, Radio, Select, Stack, Text, TextInput } from "@mantine/core";
import { Form } from "@mantine/form";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, FormEventHandler, useCallback, useEffect, useMemo, useRef } from "react";
import { addCharacterCondition, CharacterConditionUpdate, deleteCharacterCondition } from "services/api.ts";
import { Character, CharacterCondition } from "types/models.ts";
import { builder } from "utils.ts";

export interface CharacterConditionsProps {
	character: Character
	mode?: CharacterConditionMode
}

type CharacterConditionMode = 'button' | 'list' | 'all';

export function CharacterConditions({ character, mode }: CharacterConditionsProps) {
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
				children: 'Remove',
				...{
					'data-autofocus': true
				} as any
			},
			cancelProps: {
				children: 'Cancel'
			},
			onConfirm: () => {
				deleteConditionMutation.mutate(condition.id);
			},
		});
		
		openModals.current.add(id);
	}, [deleteConditionMutation, character.name]);
	
	const buttonView = useMemo(() => {
		return <>
			<ActionIcon onClick={modalHandles.open}>
				<FontAwesomeIcon icon={faPlus} />
			</ActionIcon>
		</>;
	}, []);
	
	const listView = useMemo(() => {
		return <>
			<Pill.Group>
				{character.conditions.map((c) => {
					return <Pill key={c.id} c={'blue'} size={'md'} onRemove={() => deleteCallback(c)} withRemoveButton>{c.name}</Pill>
				})}
			</Pill.Group>
		</>;
	}, [character.conditions]);
	
	return <>
		<Modal title={'Add Condition'} opened={showModal} onClose={modalHandles.close} trapFocus>
			<ConditionEditor character={character.id} onSubmit={createConditionMutation.mutate} />
		</Modal>
		{
			builder(() => {
				switch (mode ?? 'all') {
					case 'button':
						return buttonView;
					case 'list':
						return listView;
					case 'all':
						return <>
							{buttonView}
							{listView}
						</>;
					default:
						return null;
				}
			})
		}
	</>
}

interface ConditionEditorProps {
	character: number,
	onSubmit: (condition: CharacterConditionUpdate) => void
}

function ConditionEditor({ character, onSubmit }: ConditionEditorProps) {
	const [name, setName] = useInputState<string>('');
	const [type, setType] = useInputState<CharacterConditionUpdate['endType'] | string>('save');
	
	const disabled = !name || (type != 'endOfTurn' && type != 'save');
	
	const submitCallback = useCallback((event: FormEvent) => {
		onSubmit({ name, character, endType: type as any });
		
		event.preventDefault();
	}, [onSubmit, name, character, type]);
	
	return (
		<form onSubmit={submitCallback}>
			<FocusTrap>
				<Stack>
					<TextInput data-autofocus label={'Name'} value={name} onChange={setName} />
					<Radio.Group label={'End Type'}
					             value={type}
					             onChange={setType}>
						<Radio mt={'xs'} value={'save'} label={'Save'}></Radio>
						<Radio mt={'xs'} value={'endOfTurn'} label={'End of Turn'}></Radio>
					</Radio.Group>
					<Button type={'submit'} disabled={disabled}>Submit</Button>
				</Stack>
			</FocusTrap>
		</form>
	);
}