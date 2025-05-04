import { ReactElement, useMemo } from "react";

export interface InlineEditorProps {
	isEditing: boolean;
	children: {
		display: () => ReactElement;
		edit: () => ReactElement;
	}
}

export function InlineEditor({ children, isEditing }: InlineEditorProps) {

	return useMemo(() => {
		return isEditing ? children.edit() : children.display();
	}, [children.display, children.edit, isEditing]);
}