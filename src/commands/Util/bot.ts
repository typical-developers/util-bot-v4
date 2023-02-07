import { Subcommand } from "@sapphire/plugin-subcommands";
import { ApplyOptions } from "@sapphire/decorators";
import { APIApplicationCommandOption, ApplicationCommandOptionType, EmbedBuilder, inlineCode } from "discord.js";
import { isMessageInstance } from "@sapphire/discord.js-utilities";
import { dependencies, version } from "../../../package.json";
import { colors } from "../../config.json";

@ApplyOptions<Subcommand.Options>({
    description: 'Get some information relating to the bot.',
    subcommands: [
        { name: 'ping', chatInputRun: 'botPing' },
        { name: 'details', chatInputRun: 'botDetails' }
    ]
})

export class BotCommand extends Subcommand {
    readonly subcommandOptions: APIApplicationCommandOption[] = [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'ping',
            description: 'Get the bot\'s API and resposne latency.'
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'details',
            description: 'Get some neat information on the bot.'
        }
    ];

    public override registerApplicationCommands(registry: Subcommand.Registry)
    {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: this.subcommandOptions,
            dmPermission: true
        });
    }

    public async botPing(interaction: Subcommand.ChatInputCommandInteraction): Promise<void>
    {
        const RANMS = new Date().getTime();

        const DEFERREPLY = await interaction.deferReply({ fetchReply: true });
        if (isMessageInstance(DEFERREPLY))
        {
            // I'm using a list because I want to make the string not on one-line for readability, and I don't necessarily know how to do that.
            let reply = [
                `⏱ Bot Latency: ${inlineCode(Math.round(new Date().getTime() - RANMS)+'ms')}`,
                `💓 API Latency: ${inlineCode(Math.round(this.container.client.ws.ping)+'ms')}`
            ];

            await interaction.editReply({ content: reply.join('\n') });
        }

        return;
    }

    public async botDetails(interaction: Subcommand.ChatInputCommandInteraction): Promise<void>
    {
        const DEFERREPLY = await interaction.deferReply({ fetchReply: true });

        let luckfire = await this.container.client.users.fetch('399416615742996480', { force: true });
        let uptime = () =>
        {
            let uptime = this.container.client.uptime;

            const HOURS = Math.floor(uptime / 3600000) % 24;
            const MINUTES = Math.floor(uptime / 60000) % 60;
            const SECONDS = Math.floor(uptime / 1000) % 60;

            return `${HOURS > 0 ? `${HOURS} ${HOURS > 1 ? 'hours' : 'hour'}` : ''} ${MINUTES > 0 ? `${MINUTES} ${MINUTES > 1 ? 'minutes' : 'minute'}` : ''} ${SECONDS} ${SECONDS > 1 ? 'seconds' : 'second'}`;
        };
        let getDependencies = () =>
        {
            let dependenciesList: string[] = [];

            for (const [key, value] of Object.entries(dependencies))
            {
                dependenciesList.push(`${inlineCode(value)} **[${key}](https://www.npmjs.com/package/${key})**`);
            };
    
            return dependenciesList.join('\n');
        };

        const EMBED = new EmbedBuilder({
            color: colors.accent,
            thumbnail: { url: this.container.client.user.displayAvatarURL({ extension: 'png', size: 512 }) },
            fields: [
                { name: 'Uptime', value: uptime(), inline: true },
                { name: 'Version', value: version, inline: true },
                { name: 'Dependencies', value: getDependencies() }
            ],
            footer: { text: 'Made with ❤️ by LuckFire', iconURL: luckfire.displayAvatarURL({ extension: 'png', size: 512, forceStatic: false }) }
        });

        if (isMessageInstance(DEFERREPLY))
            await interaction.editReply({ embeds: [EMBED] });

        return;
    }
}