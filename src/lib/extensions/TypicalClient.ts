import {
    ApplicationCommandRegistries,
    LogLevel,
    RegisterBehavior,
    SapphireClient
} from "@sapphire/framework";
import { GatewayIntentBits, Options, Partials } from "discord.js";

export class TypicalClient extends SapphireClient
{
    public constructor()
    {
        super({
            logger: { level: LogLevel.Debug },
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent
            ],
            partials: [
                Partials.Message,
                Partials.Channel,
                Partials.Reaction
            ],
            sweepers: {
                ...Options.DefaultSweeperSettings,
                messages: {
                    interval: 1800,
                    lifetime: 900
                }
            },
            makeCache: Options.cacheWithLimits({
                ...Options.DefaultMakeCacheSettings,
                GuildInviteManager: 0,
                ReactionManager: 0,
                ReactionUserManager: 0,
                GuildMemberManager: {
                    maxSize: 50,
                    keepOverLimit: member => member.id === this.user.id
                }
            })
        });

        ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);
    }

    public async login(): Promise<string>
    {
        let token = process.env.NODE_ENV == 'production' ? process.env.PROD_CLIENT_TOKEN : process.env.DEV_CLIENT_TOKEN;

        return super.login(token);
    }
}