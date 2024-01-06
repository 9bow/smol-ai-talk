import { Message } from "@/lib/types";
import { useState } from "react";

export function useSmolTalkChat({ initialMessages }: { initialMessages?: Message[] }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const [messages, setMessages] = useState(initialMessages ?? [])
  const [isLoading, setIsLoading] = useState(false)

  const stop = () => {
    setIsLoading(false)
  }

  const reload = () => {
    setIsLoading(true)
  }

  // const reload = (0, import_react.useCallback)(
  //   async ({ options, functions, function_call } = {}) => {
  //     if (messagesRef.current.length === 0)
  //       return null;
  //     const lastMessage = messagesRef.current[messagesRef.current.length - 1];
  //     if (lastMessage.role === "assistant") {
  //       const chatRequest2 = {
  //         messages: messagesRef.current.slice(0, -1),
  //         options,
  //         ...functions !== void 0 && { functions },
  //         ...function_call !== void 0 && { function_call }
  //       };
  //       return triggerRequest(chatRequest2);
  //     }
  //     const chatRequest = {
  //       messages: messagesRef.current,
  //       options,
  //       ...functions !== void 0 && { functions },
  //       ...function_call !== void 0 && { function_call }
  //     };
  //     return triggerRequest(chatRequest);
  //   },
  //   [triggerRequest]
  // );

  return {
    input,
    setInput,
    error,
    messages: messages.map(message => ({
      ...message
    })),
    setMessages,
    isLoading,
    setIsLoading,
    stop,
    reload
  }
}