import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { inlineCode, Message } from 'discord.js';
import { ActivityPointsDatabase, GuildSettingsDatabase } from '../lib/util/Supabase';

@ApplyOptions<Listener.Options>({
    name: 'messageCreate',
    once: false
})

export class GiveXPListener extends Listener {
    public localLastRanCache: Object = {};

    public async run(message: Message): Promise<void>
    {
        if (!message) return;
        if (message.author.bot || message.channel.type == 1) return;

        const COOLDOWN = 15;
        const RUNTIME = Math.floor(new Date().getTime() / 1000);

        if (!this.localLastRanCache[message.guild.id]) this.localLastRanCache[message.guild.id] = { users: {} };
        if (this.localLastRanCache[message.guild.id].users[message.author.id] + COOLDOWN > RUNTIME) return;
        this.localLastRanCache[message.guild.id].users[message.author.id] = RUNTIME;

        const GUILDSETTINGS = await new GuildSettingsDatabase({ guildId: message.guild.id }).init();
        if (GUILDSETTINGS.hasPointsEnabled())
        {
            const RANKING = await new ActivityPointsDatabase({ guildId: message.guild.id, userId: message.author.id }).init();

            if (RANKING.isOnCooldown(COOLDOWN)) return;
            const POINTVALUES = await RANKING.updateUserPoints(2);
            const ACTIVITYROLES = GUILDSETTINGS.getActivityRoles();

            const MEMBERROLES = (await message.guild.members.fetch(message.author.id)).roles;
            if (!MEMBERROLES) return console.log(`could not find roles for ${message?.author?.id}?`);

            let points_required: number = 0;
            const ASSIGNROLES = ACTIVITYROLES.map((role) =>
            {
                points_required += role.points_required;

                if (!message.guild?.roles.cache.get(role.role_id)) return false;
                if (MEMBERROLES?.cache.has(role.role_id)) return false;
                
                return POINTVALUES.new >= points_required ? role.role_id : false;
            }).filter((value: string | boolean) => value !== false);

            if (ASSIGNROLES.length > 0)
                await MEMBERROLES.add(ASSIGNROLES);

            if (ASSIGNROLES.length == 1)
                message.channel.send({
                    content: `<@${message.author.id}> You have reached ${inlineCode(`${POINTVALUES.new} activity points`)} and unlocked ${inlineCode(message.guild.roles.cache.get(ASSIGNROLES[0]).name)}!`
                });
        }

        return;
    }
}