import { FunctionCall, Message } from '@/lib/types'
import { CheckCircledIcon, ReloadIcon } from '@radix-ui/react-icons'
import JsonView from '@uiw/react-json-view'
import { darkTheme } from '@uiw/react-json-view/dark'
import { lightTheme } from '@uiw/react-json-view/light'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

// Define the message state map
const FUNCTION_MESSAGE_MAP = {
  metaphorSearch: {
    pending: 'Searching the web...',
    resolved: 'Searched the web'
  },
  readMetaphorResult: {
    pending: 'Reading a search result...',
    resolved: 'Read a search result'
  }
}

export const ChatMessageLogs = ({ message }: { message: Message }) => {
  const [theme, setTheme] = useState(darkTheme) // Default to monokai theme

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setTheme(mediaQuery.matches ? darkTheme : lightTheme)

    // Listen for changes in color scheme preference
    const changeTheme = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? darkTheme : lightTheme)
    }

    mediaQuery.addEventListener('change', changeTheme)

    // Never not doing this again :)
    return () => mediaQuery.removeEventListener('change', changeTheme)
  }, [])

  const logs: FunctionCall[] = message.toolLogs as FunctionCall[]

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'resolved':
        return <CheckCircledIcon className="h-4 w-4" />
      case 'pending':
      default:
        return <ReloadIcon className="h-4 w-4 animate-spin" />
    }
  }

  return (
    <motion.div
      className="mb-4 flex flex-col gap-4 rounded-lg bg-white/10 p-4 text-sm shadow-xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {logs.map((log, index) => (
        <motion.div
          key={index}
          className="flex w-full flex-col items-center justify-between gap-4 rounded-lg bg-gray-800/30 p-4 shadow backdrop-blur-lg md:flex-row"
          variants={itemVariants}
        >
          <div className="flex w-4/5 flex-row items-center gap-4 font-semibold text-gray-300 md:w-1/5 md:flex-col">
            <div className="md:mx-auto">
              <StatusIcon status={log.status} />
            </div>
            <div className="md:text-center">
              {
                FUNCTION_MESSAGE_MAP[
                  log.name as keyof typeof FUNCTION_MESSAGE_MAP
                ][log.status as 'pending' | 'resolved']
              }
            </div>
          </div>
          <div className="w-4/5">
            <JsonView
              style={theme}
              value={log}
              enableClipboard={false}
              collapsed={1}
              displayDataTypes={false}
              className="overflow-scroll rounded p-3 transition-all duration-300 ease-in-out"
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
