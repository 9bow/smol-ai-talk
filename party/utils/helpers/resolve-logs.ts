import { ToolLog, FunctionCall } from '@/lib/types'

/**
 * Builds the log entry for function calls as the response comes in.
 * @param toolLogs Array of tool logs.
 * @param token Response token from LLM.
 * @returns Array of tool logs with new log entry.
 */
export const resolveLogs = (
  toolLogs: ToolLog[],
  functionCall: FunctionCall
): {
  newToolLogs: ToolLog[]
} => {

  switch (functionCall.status) {
    // If status is pending, create a new log entry
    case 'pending':
      const newLog: ToolLog = {
        type: functionCall.type,
        name: functionCall.name,
        arguments: functionCall.arguments,
        status: functionCall.status,
        content: null
      }

      // Add new pending log entry to logs array
      toolLogs.push(newLog)

      break

    // If status is resolved, update the pending log entry with the output
    case 'resolved':
      // Find the index of the pending log entry
      const pendingLogIndex = toolLogs.findIndex(
        log => log.type === 'functionCall' && log.status === 'pending'
      )

      if (pendingLogIndex !== -1) {
        // Find the pending log entry (assuming it exists)
        const pendingLog = toolLogs[pendingLogIndex] as FunctionCall

        // Update pending log entry with only the stringified content from the token response.
        const { type, status, ...content } = functionCall
        pendingLog.status = 'resolved'
        pendingLog.content = JSON.stringify(content)

        // Update the log in the logs array
        toolLogs[pendingLogIndex] = pendingLog
      }

      break

    default:
      break
  }



  return { newToolLogs: toolLogs }
}
