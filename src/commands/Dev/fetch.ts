import { Subcommand } from "@sapphire/plugin-subcommands";
import { ApplyOptions } from "@sapphire/decorators";
import {
    APIApplicationCommandBasicOption,
    APIApplicationCommandOption,
    ApplicationCommandOptionType,
    EmbedBuilder,
    TimestampStyles,
    time,
    inlineCode,
    APIEmbed
} from "discord.js";
import { colors } from "../../config.json";
import { isMessageInstance } from "@sapphire/discord.js-utilities";

@ApplyOptions<Subcommand.Options>({
    description: 'Fetch stuff from the bot.',
    subcommands: [
        { name: 'user', chatInputRun: 'userFetch' },
        { name: 'server', chatInputRun: 'serverFetch' }
    ]
})

export class FetchCommand extends Subcommand {
    readonly userCommandOptions: APIApplicationCommandBasicOption[] = [
        {
            type: ApplicationCommandOptionType.String,
            name: 'user-id',
            description: 'The ID for the user you want to fetch.',
            required: true
        }
    ];

    readonly serverCommandOptions: APIApplicationCommandBasicOption[] = [
        {
            type: ApplicationCommandOptionType.String,
            name: 'server-id',
            description: 'The ID for the server you want to fetch.',
            required: true
        }
    ];

    readonly subcommandOptions: APIApplicationCommandOption[] = [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'user',
            description: 'Fetch a user on Discord.',
            options: this.userCommandOptions
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'server',
            description: 'Fetch a server the bot is in.',
            options: this.serverCommandOptions
        }
    ];

    public override registerApplicationCommands(registry: Subcommand.Registry): void
    {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: this.subcommandOptions,
            dmPermission: true
        });
    }

    public async userFetch(interaction: Subcommand.ChatInputCommandInteraction): Promise<void>
    {
        const USERID = interaction.options.getString('user-id', true);
        const USER = await this.container.client.users.fetch(USERID, { force: true }).catch(() => undefined);

        if (!USER)
        {
            interaction.reply({ content: `${inlineCode(USERID)} does not exist.`, ephemeral: true });
            return;
        }

        const DEFERREPLY = await interaction.deferReply({ fetchReply: true });

        let { tag, accentColor, createdAt } = USER;
        let avatar = USER.displayAvatarURL();
        let banner = USER.bannerURL({ extension: 'png', size: 4096, forceStatic: false });

        const USEREMBED = new EmbedBuilder({
            color: accentColor ?? colors.embed,
            author: { name: tag, icon_url: avatar },
            thumbnail: { url: avatar },
            fields: [
                { name: 'User Mention', value: `<@${USERID}>`, inline: true },
                { name: 'User ID', value: `${USERID}`, inline: true },
                { name: 'Created On', value: time(createdAt, TimestampStyles.LongDateTime), inline: false },
            ],
            image: { url: banner }
        });

        if (isMessageInstance(DEFERREPLY))
            await interaction.editReply({ embeds: [USEREMBED] });

        return;
    }

    public async serverFetch(interaction: Subcommand.ChatInputCommandInteraction): Promise<void>
    {
        const SERVERID = interaction.options.getString('server-id', true);
        const SERVER = await this.container.client.guilds.fetch(SERVERID).catch(() => undefined);
        if (!SERVER)
        {
            interaction.reply({ content: `${inlineCode(SERVERID)} does not exist in cache.`, ephemeral: true });
            return;
        }

        const DEFERREPLY = await interaction.deferReply({ fetchReply: true });

        let { name, id, ownerId, createdAt } = SERVER;
        let icon = SERVER.iconURL({ extension: 'png', size: 512, forceStatic: false });
        let serverBanner = SERVER?.bannerURL({ extension: 'png', size: 4096, forceStatic: false });
        let vanity = await SERVER?.fetchVanityData().then((d: any) => d.uses).catch(() => 'No Vanity Uses');

        let interactionEmbeds: APIEmbed[] = [];

        // adds an owner embed. if it cant fetch them for some reason it wont add.
        const OWNER = await this.container.client.users.fetch(ownerId, { force: true }).catch(() => undefined);
        if (OWNER)
        {
            let { tag, accentColor, createdAt } = OWNER;
            let avatar = OWNER.displayAvatarURL();
            let banner = OWNER.bannerURL({ extension: 'png', size: 4096, forceStatic: false });

            interactionEmbeds = [
                new EmbedBuilder({
                    color: accentColor ?? colors.embed,
                    title: 'Owner Details',
                    author: { name: tag, icon_url: avatar },
                    thumbnail: { url: avatar },
                    fields: [
                        { name: 'User Mention', value: `<@${ownerId}>`, inline: true },
                        { name: 'User ID', value: `${ownerId}`, inline: true },
                        { name: 'Created On', value: time(createdAt, TimestampStyles.LongDateTime), inline: false },
                    ],
                    image: { url: banner }
                }).toJSON()
            ]
        }

        const MEMBERSTATUS = () =>
        {
            const presences = SERVER?.presences?.cache;

            if (!presences)
                return 'Unable to fetch presences.';

            let online = presences.filter((presence: any) => presence.status == "online").size;
            let dnd = presences.filter((presence: any) => presence.status == "dnd").size;
            let idle = presences.filter((presence: any) => presence.status == "idle").size;
            let offline = SERVER.memberCount - (online + dnd + idle);

            return `<:online:1050933076387172473> Online ${online}\n<:dnd:1050933072742326394> Do not Disturb ${dnd}\n<:idle:1050933074071920690> Idle ${idle}\n<:offline:1050933075518959727> Offline ${offline} \n${SERVER.memberCount} Total`
        };

        interactionEmbeds = [
            ...interactionEmbeds,
            new EmbedBuilder({
                color: colors.accent,
                title: 'Server Details',
                author: { name: name, iconURL: icon },
                thumbnail: { url: icon },
                image: { url: serverBanner },
                fields: [
                    { name: 'Server ID', value: id, inline: true },
                    { name: 'Created On', value: `${time(createdAt, TimestampStyles.LongDateTime)}`, inline: true },
                    { name: 'Vanity Uses', value: vanity, inline: true },
                    { name: 'Members', value: MEMBERSTATUS(), inline: false }
                ]
            }).toJSON()
        ];

        if (isMessageInstance(DEFERREPLY))
            await interaction.editReply({ embeds: interactionEmbeds });

        return;
    }
}