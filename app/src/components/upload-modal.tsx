import { useMutation } from "@tanstack/react-query";
import { ReactElement, useRef, useState } from "react";
import { Button, CloseButton, Modal } from "react-bootstrap";
import { uploadFile } from "src/services/api.ts";

export interface UploadModalProps {
	show: boolean;
	onHide?: () => void;
	accept?: string;
	children?: (file: File | null) => ReactElement;
	onComplete?: (fileName: string) => void;
}

export function UploadModal({ onComplete, onHide, show, accept, children }: UploadModalProps) {
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
		<Modal show={show} onHide={() => onClose()} backdrop="static">
			<Modal.Header>
				<Modal.Title>Upload</Modal.Title>
				<CloseButton onClick={() => onClose()} />
			</Modal.Header>
			<Modal.Body>
				<input accept={accept} onChange={() => onFileChange()} className="d-none" ref={inputRef} type="file"/>
				<div className="d-flex flex-column justify-content-center align-items-center">
					{children?.(file)}
					{
						file &&
							<label>{file?.name}</label>
					}
					<Button onClick={() => inputRef.current?.click()}>
						Select File
					</Button>
				</div>
			</Modal.Body>
			<Modal.Footer>
				<button onClick={() => uploadMutation.mutate()} disabled={submitDisabled} className="btn btn-primary">Upload</button>
			</Modal.Footer>
		</Modal>
	</>;
}