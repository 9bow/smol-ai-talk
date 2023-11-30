import type { RESTRateLimit, RESTError } from 'discord-api-types/v10';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';
import axios from 'axios';

export type DiscordFetch = ReturnType<Awaited<typeof create_discord_fetch>>;

export function create_discord_fetch(token: string) {
    const fetch = axios.create({
        baseURL: 'https://discord.com/api/v10',
        headers: {
            Authorization: token,
        },
    });

    async function fetch_fully<Result>(
        url: string,
        config: AxiosRequestConfig = {},
    ): Promise<AxiosResponse<Result>> {
        try {
            // TODO use rate limit headers
            return await fetch(url, config);
        } catch (error) {
            if (!axios.isAxiosError(error)) {
                throw error;
            }

            const status = error.status || error.response?.status;

            console.log(
                'dsc fetch error ',
                status == 429 ? 'rate limit' : status,
            );

            if (status == 429) {
                const data: RESTRateLimit = error.response?.data;
                const retry = data.retry_after * 1000;

                await new Promise((resolve) => setTimeout(resolve, retry));

                return fetch_fully<Result>(url, config);
            }

            const data: RESTError = error.response?.data || null;

            throw new Error(
                `Discord fetch to ${url} failed with ${status} - ${JSON.stringify(
                    data,
                )}`,
            );
        }
    }

    return fetch_fully;
}
