import { Subcommand } from "@sapphire/plugin-subcommands";
import { ApplyOptions } from "@sapphire/decorators";
import { APIApplicationCommandBasicOption, APIApplicationCommandOption, ApplicationCommandOptionType, AttachmentBuilder, EmbedBuilder, inlineCode } from "discord.js";
import { ActivityPointsDatabase, GuildSettingsDatabase } from "../../lib/util/Supabase";
import { isMessageInstance } from "@sapphire/discord.js-utilities";
import { RankCard } from "../../lib/extensions/cards/RankCard";
import { colors, icons } from "../../config.json";

@ApplyOptions<Subcommand.Options>({
    description: 'Get some information relating to the bot.',
    subcommands: [
        { name: 'info', chatInputRun: 'activityInfo' },
        { name: 'leaderboard', chatInputRun: 'activityLeaderboard' }
    ]
})

export class ActivityCommand extends Subcommand {
    readonly botSubCommands: APIApplicationCommandBasicOption[] = [
        {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: 'Who do you want to get activity info on?',
            required: true
        }
    ];

    readonly subcommandOptions: APIApplicationCommandOption[] = [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'info',
            description: 'Get a user\'s activity points and rank.',
            options: this.botSubCommands
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'leaderboard',
            description: 'Get the server\'s activity points leaderboard.'
        }
    ];

    public override registerApplicationCommands(registry: Subcommand.Registry): void
    {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: this.subcommandOptions,
            dmPermission: false
        });
    }

    private async guildLevelingDisabled(interaction: Subcommand.ChatInputCommandInteraction): Promise<boolean>
    {
        const GUILDSETTINGS = await new GuildSettingsDatabase({ guildId: interaction.guild.id }).init();
        if (!GUILDSETTINGS.hasPointsEnabled())
        {
            await interaction.reply({ content: 'Leveling is not enabled for this guild.' });
            return false;
        }

        return true;
    }

    private async getCurrentActivityProgress(interaction: Subcommand.ChatInputCommandInteraction, current_points: number)
    {
        const GUILDSETTINGS = await new GuildSettingsDatabase({ guildId: interaction.guild.id }).init();
        const ACTIVITYROLES = GUILDSETTINGS.getActivityRoles();

        const DETAILS = {
            current_ranking: 'No Activity Role',
            previous_points: 0,
            required_points: 0
        }

        for (let role of ACTIVITYROLES)
        {
            DETAILS.required_points += role.points_required;
            if (current_points >= DETAILS.required_points)
            {
                DETAILS.current_ranking = interaction.guild.roles.cache.get(role.role_id).name;
                continue;
            };
        
            if (current_points <= DETAILS.required_points)
            {
                DETAILS.previous_points = DETAILS.required_points;
                DETAILS.required_points = role.points_required;
                break;
            }
        }

        return DETAILS;
    }

    public async activityInfo(interaction: Subcommand.ChatInputCommandInteraction): Promise<void>
    {
        if (!await this.guildLevelingDisabled(interaction)) return;

        const DEFERREPLY = await interaction.deferReply({ fetchReply: true });

        const USER = await interaction.guild.members.fetch(interaction.options.getUser('user', true).id);
        if (!USER) {
            if (isMessageInstance(DEFERREPLY))
                await interaction.editReply({ content: 'Unable to fetch this user.' });

            return;
        }

        const ACTIVITY = await new ActivityPointsDatabase({ userId: USER.user.id, guildId: interaction.guild.id }).init();
        if (!ACTIVITY.data)
        {
            if (isMessageInstance(DEFERREPLY))
                await interaction.editReply({ content: `${inlineCode(USER.id)} has no activity data.` });

            return;
        }

        const USERRANK = await ACTIVITY.getUserRank();
        const USERPOINTS = ACTIVITY.data.amount;
        const USERCARD = new RankCard({}, {
            user:{
                name: USER.user.username,
                tag: USER.user.discriminator,
            },
            status: USER.guild.presences.cache.get(USER.id)?.status,
            avatar_url: USER.user.displayAvatarURL({ extension: 'png', size: 512, forceStatic: false })
        });
        const PROGRESS = await this.getCurrentActivityProgress(interaction, USERPOINTS);
        USERCARD.setActivityInfo({
            rank: USERRANK,
            rating: PROGRESS.current_ranking,
            points: {
                progress: USERPOINTS - (PROGRESS.previous_points - PROGRESS.required_points),
                required: PROGRESS.required_points
            }
        });

        const DRAWNCARD = await USERCARD.draw();
        const ATTACHMENT = new AttachmentBuilder(DRAWNCARD, { name: `card-${USER.id}.png` });
        if (isMessageInstance(DEFERREPLY))
            interaction.editReply({ files: [ATTACHMENT] });
    }

    public async activityLeaderboard(interaction: Subcommand.ChatInputCommandInteraction): Promise<void>
    {
        if (!await this.guildLevelingDisabled(interaction)) return;

        const RANKING = new ActivityPointsDatabase({ guildId: interaction.guild.id });
        const TOP25 = await RANKING.getGuildLeaderboard(25);
        if (!TOP25)
        {
            await interaction.reply('This guild has no leaderboard data.');
            return;
        }

        let fields = [
            { name: 'Placement', value: '', inline: true },
            { name: 'Points', value: '', inline: true }
        ];

        for (let [index] of Object.keys(TOP25).entries())
        {
            let { user_id, amount } = TOP25[index];
            let placementField = fields[0];
            let pointsField = fields[1];

            placementField.value = placementField.value + `\n${inlineCode(`${index + 1}`)} <@${user_id}>`;
            pointsField.value = pointsField.value + `\n${inlineCode(`${amount}`)}`;
        }

        const EMBED = new EmbedBuilder({
            color: colors.orange,
            author: { name: 'Activity Leaderboard', iconURL: icons.ranking },
            fields: fields
        });

        await interaction.reply({ embeds: [EMBED] });

        return;
    }
}