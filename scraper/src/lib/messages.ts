import type { RESTGetAPIChannelMessagesQuery } from 'discord-api-types/v10';
import type { APIMessage } from 'discord-api-types/v10';
import { Routes } from 'discord-api-types/v10';
import type { DiscordFetch } from './fetch';
import { date_to_snowflake } from './snowflake';

interface FetchMessageOptions {
    channel_id: string;
    start_date: Date | string;
    end_date: Date;
    fetch: DiscordFetch;
}

export async function fetch_messages(options: FetchMessageOptions) {
    const messages: APIMessage[] = [];

    const after =
        typeof options.start_date == 'string'
            ? options.start_date
            : date_to_snowflake(options.start_date);

    const result = await options.fetch<APIMessage[]>(
        Routes.channelMessages(options.channel_id),
        {
            params: {
                limit: 100,
                after,
            } satisfies RESTGetAPIChannelMessagesQuery,
        },
    );

    const data: APIMessage[] = result.data
        .reverse()
        // Make sure all messages are within start & end date
        .filter((message) => new Date(message.timestamp) < options.end_date);

    messages.push(...data);

    if (data.length == 100) {
        const extra_messages = await fetch_messages({
            ...options,
            start_date: data.at(-1)!.id,
        });

        messages.push(...extra_messages);
    }

    return messages;
}
