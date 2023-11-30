// ================================================= Config

import { sub } from 'date-fns';

export const GUILDS: Config = {
  '822583790773862470': {
    guild_name: 'Latent Space',
    channels: [
      {
        channel_name: 'ai-general-chat',
        channel_id: '1075282825051385876'
      },
      {
        channel_name: 'ai-event-announcements',
        channel_id: '1075282504648511499'
      },
      {
        channel_name: 'ai-and-ml-news',
        channel_id: '1045343195413889034'
      },
      {
        channel_name: 'llm-paper-club',
        channel_id: '1107320650961518663'
      }
    ]
  },
  '974519864045756446': {
    guild_name: 'OpenAI',
    channels: [
      {
        channel_name: 'annnouncements',
        channel_id: '977259063052234752'
      },
      {
        channel_name: 'ai-discussions',
        channel_id: '998381918976479273'
      },
      {
        channel_name: 'openai-chatter',
        channel_id: '977697652147892304'
      },
      {
        channel_name: 'openai-questions',
        channel_id: '974519864045756454'
      },
      {
        channel_name: 'gpt-4-discussions',
        channel_id: '1001151820170801244'
      },
      {
        channel_name: 'prompt-engineering',
        channel_id: '1046317269069864970'
      },
      {
        channel_name: 'api-discussions',
        channel_id: '1046317269069864970'
      },
      { channel_name: 'api-projects', channel_id: '1037561385070112779' }
    ]
  },
  '1038097195422978059': {
    guild_name: 'LangChain AI',
    channels: [
      {
        channel_name: 'announcements',
        channel_id: '1058033358799655042'
      },
      {
        channel_name: 'general',
        channel_id: '1038097196224086148'
      },
      {
        channel_name: 'langserve',
        channel_id: '1170024642245832774'
      },
      {
        channel_name: 'langchain-templates',
        channel_id: '1170025009960456282'
      },
      {
        channel_name: 'share-your-work',
        channel_id: '1038097372695236729'
      },
      {
        channel_name: 'tutorials',
        channel_id: '1077843317657706538'
      }
    ]
  },
  '1053877538025386074': {
    guild_name: 'Nous Research AI',
    channels: 'ALL',
    ignore_channels: ['welcomes']
  },
  '1087862276448595968': {
    guild_name: 'Alignment Lab AI',
    channels: 'ALL'
  },
  '1131084849432768614': {
    guild_name: 'Skunkworks AI',
    channels: 'ALL',
    ignore_channels: ['welcome']
  },
  '1168579740391710851': {
    guild_name: 'LLM Perf Enthusiasts AI',
    channels: 'ALL',
    ignore_channels: ['welcome', 'intros']
  },
  '814557108065534033': {
    guild_name: 'MLOps @Chipro',
    channels: [
      { channel_name: 'events', channel_id: '869270934773727272' },
      { channel_name: 'general-ml', channel_id: '828325357102432327' }
    ]
  },
  '1147858054231105577': {
    guild_name: 'Ontocord (MDEL discord)',
    channels: [
      {
        channel_name: 'general',
        channel_id: '1147858055095140475'
      },
      {
        channel_name: 'reads',
        channel_id: '1147863416925597736'
      },
      {
        channel_name: 'mdel-paper',
        channel_id: '1147862852997238866'
      },
      {
        channel_name: 'mdel-general',
        channel_id: '1147862447252848732'
      },
      {
        channel_name: 'mdel-m3rlin-multidomain',
        channel_id: '1147862787826130975'
      }
    ]
  },
  '1144960932196401252': {
    guild_name: 'AI Engineer Foundation',
    channels: [
      { channel_name: 'general', channel_id: '1144960932657758210' },
      { channel_name: 'events', channel_id: '1144960932657758212' },
      {
        channel_name: 'agent-protocol',
        channel_id: '1169804478296379422'
      }
    ]
  },
  '1047197230748151888': {
    guild_name: 'Perplexity AI',
    channels: [
      {
        channel_name: 'announcements',
        channel_id: '1047204950763122820'
      }
    ]
  },
  '958905134119784489': {
    guild_name: 'YAIG (a16z Infra)',
    channels: [
      { channel_name: 'ai-ml', channel_id: '1013536071709118565' },
      {
        channel_name: 'tech-discussion',
        channel_id: '960713746702020608'
      }
    ]
  }
}

export const START_DATE: Date = sub(new Date(), { hours: 24 })
export const END_DATE: Date = new Date()

export const EMAIL_SUBJECT = `[AINews] AI Discords Newsletter  ${END_DATE.toLocaleDateString()}`

// ================================================= Types

export type Config = Record<string, ConfigGuild>

export interface ConfigGuild {
  guild_name: string
  channels: ConfigChannel[] | 'ALL'
  ignore_channels?: string[]
}

export interface ConfigChannel {
  channel_name: string
  channel_id: string
}

// ================================================= Setup

import 'dotenv/config'
import { mkdir } from 'fs/promises'
import { intro } from '@clack/prompts'

await mkdir('./output', { recursive: true })

intro('Discord Newsletter Script')

// ================================================= Get messages & summaries

// import { confirm, isCancel, cancel } from '@clack/prompts';
import type { GuildSummary } from './lib/ai'
import { sync_messages } from './messages'
import { readFile, rm } from 'fs/promises'
import { summarise } from './summarise'
import { existsSync } from 'fs'

// let summaries: GuildSummary[] | null = null;

// if (existsSync('./output/summaries.json')) {
//     const result = await confirm({
//         message: 'Use summaries cache?',
//         initialValue: false,
//     });

//     if (isCancel(result)) {
//         cancel('Exiting');
//         process.exit(0);
//     }

//     if (result === true) {
//         const raw_summaries = await readFile(
//             './output/summaries.json',
//             'utf-8',
//         );

//         summaries = JSON.parse(raw_summaries);
//     }
// }

// if (!summaries) {
//     await rm('./output/summaries.json', { force: true });
//     await rm('./output/discord.json', { force: true });

//     const messages = await sync_messages();
//     summaries = await summarise(messages);
// }

const messages = await sync_messages()
const summaries = await summarise(messages)
// throw new Error('stop here')

// ================================================= Send Newsletter

import buttondown from 'buttondown'

buttondown.setApiKey(process.env.BUTTONDOWN_API_KEY!)

console.log('\n\nSending email with buttondown')

await buttondown.emails.create({
  subject: EMAIL_SUBJECT,
  body:
    '[TOC] \n\n' + summaries.map(summary => summary.content).join('\n\n---\n')
})

// ================================================= Cleanup

import { outro } from '@clack/prompts';

outro('Discord Newsletter Sent!');
