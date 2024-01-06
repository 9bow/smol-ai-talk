import type { GuildData, GuildChannelData } from './lib/types';
import { END_DATE, GUILDS, START_DATE } from './script';
import { create_discord_fetch } from './lib/fetch';
import { fetch_messages } from './lib/messages';
import { writeFile } from 'fs/promises';
import { fetch_channels } from './lib/channels';

export async function sync_messages() {
  const $fetch = create_discord_fetch(process.env.DISCORD_TOKEN!)
  const data: GuildData[] = []

  // prettier-ignore
  console.log(`Fetching ${Object.keys(GUILDS).length} Guilds and outputting to "./output/discord.json"`)

  for (const [guild_id, guild_data] of Object.entries(GUILDS)) {
    const channelData: GuildChannelData[] = []

    if (guild_data.channels == 'ALL') {
      guild_data.channels = await fetch_channels($fetch, guild_id)
      // exclude guild_data.ignore_channels
      if (guild_data.ignore_channels) {
        guild_data.channels = guild_data.channels.filter(
          channel => !guild_data.ignore_channels?.includes(channel.channel_name)
        )
      }
    }
    const { channels, guild_name } = guild_data

    // prettier-ignore
    console.log(`\n\nProcessing ${channels.length} channels in "${guild_name}" (${guild_id})`);

    for (const { channel_id, channel_name } of channels) {
      console.log(`    Processing channel "${channel_name}" (${channel_id})`)

      try {
        let messages = await fetch_messages({
          start_date: START_DATE,
          end_date: END_DATE,
          fetch: $fetch,
          channel_id
        })
        messages = messages.filter(message => message.content.length > 2)

        if (messages.length) {
          // console.log('messages', messages);
          channelData.push({
            channel_id,
            channel_name,
            messages: messages.map(
              message => `${message.author.username}: ${message.content}`
            )
          })
        }
      } catch (err: any) {
        const errorCode = err.response?.data?.code || err.code
        if (errorCode === 50001) {
          console.log(
            ` skipped channel ${channel_name} due to Missing Access error`
          )
        } else if (errorCode === 50013) {
          console.log(
            ` skipped channel ${channel_name} due to Missing Permissions error`
          )
        } else if (errorCode === 10003) {
          console.error(
            ` skipped channel ${channel_name} due to Unknown Channel error. pls check ${channel_id} in source code`
          )
        } else {
          console.error('    Error processing channel', err)
        }
      }
    }

    data.push({
      guild_id,
      guild_name,
      channels: channelData
    })
  }

  // sort data by sum of number of messages in each channel
  let f = (x: GuildData) =>
    x.channels.reduce((acc, cur) => acc + cur.messages.length, 0)
  // descending order
  data.sort((a, b) => f(b) - f(a))

  await writeFile(
    './output/discord.json',
    JSON.stringify(data, null, 2),
    'utf-8'
  )

  return data
}
