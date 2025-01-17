import React, { ReactElement } from "react";

export interface SwitchProps {
	fallback?: ReactElement;
	children: ReactElement<CaseProps>[] | ReactElement<CaseProps>;
}

export function Switch({ fallback, children }: SwitchProps): React.ReactNode {
	const toUse = (() => {
		let c = children;
		if (!Array.isArray(c)) {
			c = [c];
		}
		
		return c.find((child) => child.props.when) ?? fallback;
	})();
	
	return <>
		{toUse ? toUse : <></>}
	</>

}

export interface CaseProps {
	when: boolean;
	children: React.ReactNode | (() => React.ReactNode);
}

export function Case({ when, children }: CaseProps): React.ReactNode {
	return when ? typeof children === 'function' ? children() : children : null;
}


export interface ShowProps {
	when: boolean;
	children: React.ReactNode | (() => React.ReactNode);
}

export function Show({when, children}: ShowProps): React.ReactNode {
	return when ? typeof children === 'function' ? children() : children : null;
}