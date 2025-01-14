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
	children: React.ReactNode;
}

export function Case({ children }: CaseProps): React.ReactNode {
	
	return children;
}