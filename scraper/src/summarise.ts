import { type GuildSummary, summarizeGuild } from './lib/ai';
import { GuildData } from './lib/types';
import { writeFile } from 'fs/promises';
import { GUILDS } from './script';

export async function summarise(data: GuildData[]) {
    const summaries: GuildSummary[] = [];

    // prettier-ignore
    console.log(`\n\nSummarising ${Object.keys(GUILDS).length} Guilds and outputting to "./output/summaries.json"`);

    for (const guild of data) {
        try {
            const summary = await summarizeGuild(guild);

            summaries.push(summary);

            await writeFile(
                `./output/${summary.guildName.toLowerCase()}.md`,
                summary.content ?? '',
                'utf-8',
            );
        } catch (err) {
            console.log(
                `Failed to summarise ${guild.guild_name} (${guild.guild_id})`,
            );
            console.error(err);
        }
    }

    await writeFile(
        './output/summaries.json',
        JSON.stringify(summaries, null, 4),
        'utf-8',
    );

    return summaries;
}
