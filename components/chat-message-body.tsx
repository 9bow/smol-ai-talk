import { Message } from "@/lib/types"
import Markdown from "react-markdown"
import { MarkdownComponents } from "@/components/markdown-components"
import remarkGfm from "remark-gfm"

export default function ChatMessageBody({ message }: { message: Message  }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={MarkdownComponents}
      className='break-words'
    >
      {message.content}
    </Markdown>
  )
}