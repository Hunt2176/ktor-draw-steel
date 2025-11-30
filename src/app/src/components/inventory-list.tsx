import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ActionIcon, Button, Grid, Group, Modal, NumberInput, Popover, Stack, Table, Text, TextInput } from "@mantine/core";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { useMutation } from "@tanstack/react-query";
import { ConfirmationPopover } from "components/confirmation-popover.tsx";
import { ValueModifier, ValueModifierChangeEvent } from "components/value-modifier.tsx";
import { createInventoryItem, deleteInventoryItem, modifyInventoryItemQuantity } from "services/api.ts";
import { InventoryItem } from "types/models.ts";
import { parseIntOrUndefined } from "utils.ts";

export interface InventoryListProps {
	items: InventoryItem[],
	characterId?: number,
	onQuantityChange?: (itemId: number, newQuantity: number) => void,
	
}

export function InventoryList(props: InventoryListProps) {
	const { characterId, items, onQuantityChange } = props;
	
	
	const [newName, setNewName] = useInputState('');
	const [newQuantity, setNewQuantity] = useInputState<string | number>(1);
	const [newItemOpen, newItemOpenActions] = useDisclosure(false, {
		onOpen: () => {
			setNewName('');
			setNewQuantity(1);
		}
	});
	
	const quantityMod = useMutation({
		mutationFn: async (options: { item: number, event: ValueModifierChangeEvent }) => {
			const { item, event } = options;
			
			return modifyInventoryItemQuantity(item, event);
		},
		onSuccess: (data) => {
			onQuantityChange?.(data.id, data.quantity);
		}
	});
	
	const itemAddMod = useMutation({
		mutationFn: async (item: { characterId: number, name: string, quantity: number }) => {
			const { characterId, name, quantity } = item;
			if (quantity <= 0) {
				return null;
			}
			
			return createInventoryItem(characterId, { name, quantity });
		},
		onSuccess: () => {
			newItemOpenActions.close();
		}
	});
	
	const removeItemMod = useMutation({
		mutationFn: async (itemId: number) => {
			return deleteInventoryItem(itemId);
		}
	});
	
	const tableRows = items.map(item => {
		return (
			<Table.Tr key={item.id}>
				<Table.Td>
					<Text>{ item.name }</Text>
				</Table.Td>
				<Table.Td>
					<Popover>
						<Popover.Target>
							<Text>{ item.quantity }</Text>
						</Popover.Target>
						<Popover.Dropdown>
							<ValueModifier label={'Modify Quantity'}
							               onChange={(event) => {
								               quantityMod.mutate({item: item.id, event: event})
							               }}></ValueModifier>
						</Popover.Dropdown>
					</Popover>
				</Table.Td>
				<Table.Td align={'right'}>
					<ConfirmationPopover title={`Remove ${item.name}`}
					                     message={'Are you sure?'}
					                     onAccept={() => removeItemMod.mutate(item.id)}>
						{(open) => {
							return (
								<ActionIcon onClick={open} color={'red'}>
									<FontAwesomeIcon icon={faTrash}></FontAwesomeIcon>
								</ActionIcon>
							);
						}
						}
					</ConfirmationPopover>
				</Table.Td>
			</Table.Tr>
		)
	});
	
	const tableElement = (
		<Table>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Item</Table.Th>
					<Table.Th>Quantity</Table.Th>
					<Table.Th></Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{ ...tableRows }
			</Table.Tbody>
		</Table>
	)
	
	const newItemEl = (characterId != null)
			? <>
					<Grid justify={'end'}>
						<Button onClick={newItemOpenActions.open} color={'green'} variant={'transparent'}>
							<FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>
							<Text ml={'xs'}>Add Item</Text>
						</Button>
					</Grid>
					<Modal title={'New Item'} opened={newItemOpen} onClose={newItemOpenActions.close}>
						<Stack>
							<TextInput data-autofocus label={'Name'} placeholder={'Name'} value={newName} onChange={setNewName}></TextInput>
							<NumberInput label={'Quantity'}
							             placeholder={'Quantity'}
							             value={newQuantity}
							             min={1}
							             clampBehavior={'strict'}
							             onChange={setNewQuantity}></NumberInput>
							<Group>
								<Button disabled={newName.trim().length <= 0} variant={'filled'} onClick={() => {
									itemAddMod.mutate({characterId, name: newName, quantity: parseIntOrUndefined(newQuantity) ?? 0})
								}}>
									<Text>Save</Text>
								</Button>
							</Group>
						</Stack>
					</Modal>
				</>
			: <></>;
	
	return (
		<>
			<Stack>
				{ newItemEl }
				{ tableElement }
			</Stack>
		</>
	);
}