import { Button, Grid, Group, Popover, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ReactNode } from "react";

export interface ConfirmationPopoverProps {
	children: (setOpen: VoidFunction) => ReactNode,
	title: string,
	message: string,
	onAccept: VoidFunction,
	onCancel?: VoidFunction
}


export function ConfirmationPopover(props: ConfirmationPopoverProps) {
	const { children, title, message, onAccept, onCancel } = props;
	const [opened, openedHandlers] = useDisclosure(false);
	
	return (
		<Popover width={'auto'} withArrow opened={opened}>
			<Popover.Target>
				{ children(openedHandlers.open) }
			</Popover.Target>
			<Popover.Dropdown>
				<Stack>
					<Text>{ title }</Text>
					<Text> { message } </Text>
					<Grid>
						<Grid.Col span={6}>
							<Button onClick={() => {
								openedHandlers.close();
								onCancel?.();
							}}>
								<Text>Cancel</Text>
							</Button>
						</Grid.Col>
						<Grid.Col span={6}>
							<Button onClick={() => {
								openedHandlers.close();
								onAccept();
							}}>
								<Text>Confirm</Text>
							</Button>
						</Grid.Col>
					</Grid>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	)
}