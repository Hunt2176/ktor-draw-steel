import { useDisclosure, useInputState } from "@mantine/hooks";
import { useMutation } from "@tanstack/react-query";
import { InlineEditor } from "components/inline-editor.tsx";
import { createContext, MutableRefObject, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { updateCampaign } from "services/api.ts";
import { Campaign } from "types/models.ts";
import { Box, Button, Divider, Flex, Modal, Text, Textarea } from "@mantine/core";

export interface FaqDisplayContextProps {
	open: (c: Campaign) => void;
	close: VoidFunction;
}

const FaqDisplayContext = createContext<FaqDisplayContextProps | null>(null);

export function useFaqDisplay(): FaqDisplayContextProps {
	const context = useContext(FaqDisplayContext);
	
	if (context == null) {
		throw new Error('useFaqDisplay must be used within a FaqProvider');
	}
	
	return {
		open: (c: Campaign) => {
			context.open(c);
		},
		close: () => {
			context.close();
		}
	}
}

export function FaqProvider({ children }: { children: ReactNode }) {
	const [faqCampaign, setFaqCampaign] = useState<Campaign>();
	const [isEditing, setEditing] = useDisclosure(false);
	const faqEditText = useRef(() => '');
	
	const saveCampaignFaq = useMutation({
		mutationFn: (campaign: Campaign) => {
			return updateCampaign(campaign.id, { faqText: faqEditText.current() });
		},
		onSuccess: () => {
			setEditing.close();
		}
	});
	
	const save = () => {
		if (faqCampaign == null) {
			return;
		}
		
		saveCampaignFaq.mutate(faqCampaign);
	}
	
	const isOpen = useMemo(() => {
		return faqCampaign != null;
	}, [faqCampaign]);
	
	const internal = useMemo(() => {
		if (faqCampaign == null) {
			return <></>
		}
		
		const footer = isEditing
			? <>
				<Button color={'gray'} onClick={() => setEditing.close()}>
					<Text>Cancel</Text>
				</Button>
				<Button onClick={() => save()}>
					<Text>Save</Text>
				</Button>
			</>
			: <>
				<Button onClick={() => setEditing.open()}>
					<Text>Edit</Text>
				</Button>
			</>;
		return <>
			<Box>
				<FaqDisplay valueRef={faqEditText} isEditing={isEditing} campaign={faqCampaign}></FaqDisplay>
			</Box>
			<Divider my={'md'} />
			<Flex justify={'end'} gap={'sm'}>
				{footer}
			</Flex>
		</>;
	}, [faqCampaign, isOpen, isEditing]);
	
	return <>
		<FaqDisplayContext.Provider value={{ open: (c) => setFaqCampaign(c), close: () => setFaqCampaign(undefined) }}>
			<Modal opened={isOpen} onClose={() => setFaqCampaign(undefined)} title={'FAQ'}>
				{ internal }
			</Modal>
			{children}
		</FaqDisplayContext.Provider>
	</>
}

export interface FaqDisplayProps {
	campaign: Campaign;
	isEditing: boolean;
	valueRef?: MutableRefObject<() => string>;
}

export function FaqDisplay({ campaign, isEditing, valueRef }: FaqDisplayProps) {
	const [faqText, setFaqState] = useInputState(campaign.faqText ?? undefined);
	
	const cb = useCallback(() => {
		return faqText ?? '';
	}, [faqText]);
	
	if (valueRef != null) {
		valueRef.current = cb;
	}
	
	useEffect(() => {
		setFaqState(campaign.faqText);
	}, [isEditing]);
	
	const display = useMemo(() => {
		if (campaign.faqText == null) {
			return <></>
		}
		
		return <>
			<Text style={{whiteSpace: 'pre-wrap'}}>{ campaign.faqText }</Text>
		</>
	}, [campaign.faqText]);
	
	const edit = useMemo(() => {
		return <Textarea autosize={true} value={faqText} onChange={setFaqState}></Textarea>
	}, [ faqText, setFaqState ]);
	
	return <>
		<InlineEditor isEditing={isEditing}>
			{{
				display: () => <>
					<Box>
						{ display }
					</Box>
				</>,
				edit: () => <>
					{ edit }
				</>
			}}
		</InlineEditor>
	</>
}