"use client"

import type { ThreadChatMessage } from "@/types/community"
import { ChatPanel } from "@/components/community/chat-panel"

interface CommunityChatProps {
	messages: ThreadChatMessage[]
	isSaving: boolean
	onSend: (content: string) => Promise<void>
}

export function CommunityChat({ messages, isSaving, onSend }: CommunityChatProps) {
	return <ChatPanel messages={messages} isSaving={isSaving} onSend={onSend} />
}
