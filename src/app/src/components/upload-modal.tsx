import { Button, Divider, FileButton, Group, Modal, useModalsStack } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { ReactElement, useId, useRef, useState } from "react";
import { uploadFile } from "services/api.ts";

export interface UploadModalProps {
	stackId?: string;
	show: boolean;
	onHide?: () => void;
	accept?: string;
	children?: (file: File | null) => ReactElement;
	onComplete?: (fileName: string) => void;
}

export function UploadModal({ stackId, onComplete, onHide, show, accept, children }: UploadModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	
	const uploadMutation = useMutation({
		mutationFn: async () => {
			if (file == null) {
				throw new Error('No file selected');
			}
			
			return uploadFile(file);
		},
		onSuccess: (data) => {
			onComplete?.(data.fileName);
		}
	});
	
	const submitDisabled = uploadMutation.isPending || file == null;
	
	function onClose() {
		setFile(null);
		onHide?.();
	}
	
	function onFileChange() {
		const input = inputRef.current;
		if (input == null) {
			setFile(null);
			return;
		}
		
		const file = input.files?.item(0)
		setFile(file ?? null);
	}
	
	return <>
		<Modal stackId={stackId} title={'Upload'} opened={show} onClose={onClose}>
			<input accept={accept} onChange={() => onFileChange()} className="d-none" ref={inputRef} type="file"/>
			<div className="d-flex flex-column justify-content-center align-items-center">
				{children?.(file)}
				{
					file &&
						<label>{file?.name}</label>
				}
				<FileButton onChange={(e) => setFile(e)}>
					{(props) => {
						return <>
							<Button {...props}>Select File</Button>
						</>
					}}
				</FileButton>
			</div>
			<Divider my="md"/>
			<Group justify="end">
				<Button onClick={() => uploadMutation.mutate()} disabled={submitDisabled} className="btn btn-primary">Upload</Button>
			</Group>
		</Modal>
	</>;
}