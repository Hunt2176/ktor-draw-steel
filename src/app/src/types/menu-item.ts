import { IconDefinition } from "@fortawesome/angular-fontawesome";

export interface MenuItem {
	label: string;
	command: VoidFunction;
	iconDefinition?: IconDefinition;
	className?: string;
}