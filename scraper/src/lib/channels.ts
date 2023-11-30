import type { APIChannel } from 'discord-api-types/v10';
import { ChannelType, Routes } from 'discord-api-types/v10';
import type { DiscordFetch } from './fetch';
import { ConfigChannel } from '../script';

const TEXT_CHANNEL_TYPES = [
    ChannelType.GuildAnnouncement,
    ChannelType.GuildText,
];

export async function fetch_channels(
    fetch: DiscordFetch,
    guild_id: string,
): Promise<ConfigChannel[]> {
    const channels = await fetch<APIChannel[]>(Routes.guildChannels(guild_id));

    return channels.data
        .filter((channel) => TEXT_CHANNEL_TYPES.includes(channel.type))
        .map((channel) => ({
            channel_name: channel.name!,
            channel_id: channel.id,
        }));
}
