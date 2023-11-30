export interface GuildChannelData {
    channel_id: string;
    channel_name: string;
    messages: string[];
}

export interface GuildData {
    guild_id: string;
    guild_name: string;
    channels: GuildChannelData[];
}
