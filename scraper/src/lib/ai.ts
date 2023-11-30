import type { GuildData, GuildChannelData } from './types.d';
import { stripIndent } from 'common-tags';

import {
    ChatCompletionRequestMessageRoleEnum,
    Configuration,
    OpenAIApi,
    ChatCompletionRequestMessage,
} from 'smolai';

import {
    channelEndPrompt,
    channelPrompt,
    guildEndPrompt,
    guildPrompt,
} from './prompts';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export interface GuildSummary {
    guildName: string;
    finishReason: string;
    index: number;
    role: ChatCompletionRequestMessageRoleEnum;
    content: string;
}

export async function summarizeGuild(
  guildData: GuildData
): Promise<GuildSummary> {
  // prettier-ignore
  console.log(`\n\nSummarising ${guildData.channels.length} channels in "${guildData.guild_name}" (${guildData.guild_id})`);

  const summaries = await Promise.all(
    guildData.channels
      // filter out channels that have no messages
      .filter(channel => channel.messages.length > 0)
      .map(async channel => {
        return {
          guildName: guildData.guild_name,
          channelName: channel.channel_name,
          channel_id: channel.channel_id,
          summary: await summarizeChannel(
            guildData.guild_name,
            channel.channel_name,
            channel
          ),
          channel
        }
      })
  )

  let messages = summaries
    .map(summary => {
      if (summary === null) return null

      return {
        role: 'user' as ChatCompletionRequestMessageRoleEnum,
        summary
      }
    })
    .filter(Boolean)
    .filter(
      (
        x
      ): x is {
        role: ChatCompletionRequestMessageRoleEnum
        content?: string
        summary: any
      } => x !== null
    )

  if (messages.length < 1) {
    return {
      guildName: guildData.guild_name,
      finishReason: 'NO NEW MESSAGES',
      index: 0,
      role: 'user',
      content:
        'The ' +
        guildData.guild_name +
        ' Discord has no new messages. If this guild has been quiet for too long, let us know and we will remove it.'
    }
  } else if (summaries.length < 2) {
    // content: 'Only 1 channel had activity, so no need to summarize...',

    // combine guild level summary and all chanenl summaries
    const totalSummary = `
## [${guildData.guild_name}](https://discord.com/channels/${
      guildData.guild_id
    }) Discord Summary

Only 1 channel had activity, so no need to summarize...

${messages.map(message => message.content).join('\n\n\n')}
        `
    return {
      guildName: guildData.guild_name,
      finishReason: 'ONLY ONE CHANNEL',
      index: 0,
      role: 'user',
      content: totalSummary
    }
  } else {
    const messagesFinal: ChatCompletionRequestMessage[] = messages.map(
      (message, index) => ({
        role: message.role,
        content: stripIndent`
        ### ▷ #[${message.summary.channelName}](https://discord.com/channels/${
          guildData.guild_id
        }/${message.summary.channel_id}) (${
          message.summary.channel.messages.length
        } messages${
          message.summary.channel.messages.length > 2
            ? '🔥'.repeat(
                Math.min(
                  11,
                  Math.floor(
                    Math.log(message.summary.channel.messages.length) / 5
                  )
                )
              )
            : ''
        }): 
        
        ${message.summary.summary.content}
        `
      })
    )
    const response = await openai.createChatCompletion({
      model: process.env.OPENAI_MODEL || 'gpt-4-32k',
      messages: [
        {
          role: 'system',
          content: guildPrompt(guildData)
        },
        ...messagesFinal,
        {
          role: 'system',
          content: guildEndPrompt
        }
      ]
    })

    const [data] = response.data.choices

    // combine guild level summary and all chanenl summaries
    const totalSummary = `
## [${guildData.guild_name}](https://discord.com/channels/${
      guildData.guild_id
    }) Discord Summary

${data.message?.content!}

**${guildData.guild_name} Channel Summaries**

${messages.map(message => message.content).join('\n\n\n')}


        `

    return {
      guildName: guildData.guild_name,
      finishReason: data.finish_reason!,
      index: data.index!,
      role: data.message?.role!,
      content: totalSummary
    }
  }
}

async function summarizeChannel(
  guildName: string,
  channelName: string,
  channelData: GuildChannelData
) {
  // prettier-ignore
  console.log(`    Summarising channel "${channelName}" (${channelData.channel_id})`);

  if (channelData.messages.length < 2) {
    return {
      guildName,
      channelName,
      finishReason: 'No need to summarize',
      index: 0,
      role: 'system',
      content: channelData.messages[0]
    }
  } else {
    const response = await openai.createChatCompletion({
      model: 'gpt-4-32k',
      messages: [
        {
          role: 'system',
          content: channelPrompt(guildName, channelName)
        },
        ...channelData.messages.map(message => {
          return {
            role: 'user' as ChatCompletionRequestMessageRoleEnum,
            content: message
          }
        }),
        {
          role: 'system',
          content: channelEndPrompt
        }
      ]
    })

    const [data] = response.data.choices

    return {
      guildName,
      channelName,
      finishReason: data.finish_reason,
      index: data.index,
      role: data.message?.role,
      content: data.message?.content
    }
  }
}
