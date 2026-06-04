import React from "react";

export interface ClickableProps {
	onClick: () => void;
	children: React.ReactNode;
}
export function Clickable({onClick,  children}: ClickableProps) {
	return <div onClick={onClick} style={{display: 'contents', cursor: 'pointer'}}>
		{children}
	</div>
}