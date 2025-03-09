import { Button, FileButton, Select, TextInput, Image } from "@mantine/core";
import { useDidUpdate, useInputState } from "@mantine/hooks";
import { ArkErrors } from "arktype";
import { useMemo } from "react";
import { DisplayEntry } from "types/models.ts";
import Types, { RootScope } from "types/types.ts";

export interface DisplayEntryEditorProps {
	entry?: DisplayEntryEditable;
	onChange: (update: DisplayEntryEditorUpdate | ArkErrors) => void
}

export function DisplayEntryEditor({ entry: initEntry, onChange }: DisplayEntryEditorProps) {
	const entry: DisplayEntryState = initEntry
		? { file: null, ...initEntry }
		: {
			title: '',
			description: '',
			type: 'Portrait',
			file: null,
		};
	
	const [title, setTitle] = useInputState(entry.title);
	const [description, setDescription] = useInputState(entry.description);
	const [type, setType] = useInputState(entry.type);
	const [pictureUrl, setPictureUrl] = useInputState(entry.pictureUrl);
	
	const [image, setImage] = useInputState<File | null>(null);
	
	useDidUpdate(() => {
		const update = EditorUpdateType({
			title: title,
			description: description,
			type: type,
			pictureUrl: pictureUrl,
			file: image
		});
		
		onChange(update);
	}, [title, description, type, pictureUrl, image]);
	
	const imageDisplay = useMemo(() => {
		if (image == null && pictureUrl == null) {
			return <></>;
		}
		
		if (image != null) {
			const imageUrl = URL.createObjectURL(image);
			return <Image src={imageUrl} fit={'contain'} />
		}
		
		return <Image src={pictureUrl} fit={'contain'} />
	}, [image, pictureUrl]);
	
	return <>
		<TextInput label={'Title'} value={title} onChange={setTitle}></TextInput>
		<TextInput label={'Description'} value={description ?? undefined} onChange={setDescription}></TextInput>
		<Select label={'Type'} value={type} data={['Portrait', 'Background'] as const} onChange={(e) => setType(e as typeof type)} />
		<FileButton onChange={setImage}>
			{ (props) => <>
				<Button {...props}>
					{pictureUrl == null ? 'Add' : 'Replace'} Image
				</Button>
			</>}
		</FileButton>
		{imageDisplay}
	</>
}

const EditorUpdateType = RootScope.type({
	title: /[a-zA-Z]+/,
	'description?': 'string',
	'type': Types.DisplayEntry.get('type'),
	file: 'File | null',
});

export type DisplayEntryEditorUpdate = typeof EditorUpdateType.infer;

type DisplayEntryEditable = Omit<DisplayEntry, 'id'>;
type DisplayEntryState = { file: File | null } & {
	[K in keyof DisplayEntryEditable]?: DisplayEntryEditable[K] extends null | undefined ? NonNullable<DisplayEntryEditable[K]> | undefined : DisplayEntryEditable[K]
}

