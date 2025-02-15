import { Box } from "@mantine/core";
import React, { Fragment, useMemo } from "react";
import { Vararg } from "src/utils.ts";

export interface AnchoredProps {
	position: 'left' | 'right'
	children: Vararg<React.ReactNode>;
}

export function Anchored({ position, children }: AnchoredProps) {
	const childrenArray = useMemo(() => React.Children.toArray(children), [children]);
	return <>
		<Box display={'inline-block'} p={'sm'} w={'fit-content'} className={`blur ${position}-anchored`}>
			{
				childrenArray.map((child, index) =>
					<Fragment key={index}>{child}</Fragment>
				)
			}
		</Box>
	</>;
}