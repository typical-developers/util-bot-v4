import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { type TextChannel, type GuildMember, AttachmentBuilder, inlineCode } from 'discord.js';
import { WelcomeCard } from '../lib/extensions/cards/WelcomeCard';
import { GuildSettingsDatabase } from '../lib/util/Supabase';

@ApplyOptions<Listener.Options>({
    name: 'guildMemberAdd',
    once: false
})

export class WelcomeMemberListener extends Listener {
    private randomJoinString(): string
    {
        let strings = [
            'Akkoza says hi. Say hi back or he\'ll bonk you.',
            'I hope you can help fix Akkoza\'s procrastination problem.',
            'Hoofer casts a nice spell on you.',
            'It\'s nice to see a new face every once in a while!',
            'We\'ve been expecting your arrival.',
            'Never gonna give you up, never gonna let you down.',
            'You just lost the game. Yep. I went there.',
            'Feel free to make yourself at home!'
        ];

        return strings[Math.floor(Math.random() * strings.length)];
    }

    public async run(member: GuildMember): Promise<void>
    {
        const GUILDSETTINGS = await new GuildSettingsDatabase({ guildId: member.guild.id }).init();
        if (!GUILDSETTINGS.hasWelcomeNotifsEnabled()) return;

        // uses a timeout so it can have time to add member to cache.
        setTimeout(async () => {
            const MEMBER = await member.guild.members.fetch(member.id);
            const WELCOMECHANNEL = member.guild.channels.cache.get(GUILDSETTINGS.getWelcomeChannel()) as TextChannel;
            let welcome_string = GUILDSETTINGS.getWelcomeString();

            if (!WELCOMECHANNEL) return;
            if (!welcome_string) return;
            
            // will do this properly in the future when it needs to be done properly.
            welcome_string = welcome_string
             .replaceAll('{{user-mention}}', `<@${member.user.id}>`)
             .replaceAll('{{guild-name}}', inlineCode(member.guild.name));

            if (GUILDSETTINGS.hasWelcomeCardEnabled())
            {
                const WELCOMECARD = new WelcomeCard({}, {
                    user:{
                        name: MEMBER.user.username,
                        tag: MEMBER.user.discriminator,
                    },
                    status: MEMBER.guild.presences.cache.get(MEMBER.id)?.status,
                    avatar_url: MEMBER.user.displayAvatarURL({ extension: 'png', size: 512, forceStatic: false })
                }, this.randomJoinString());

                const DRAWNCARD = await WELCOMECARD.draw();
                const ATTACHMENT = new AttachmentBuilder(DRAWNCARD, { name: `welcome-${MEMBER.id}.png` });
                await WELCOMECHANNEL.send({ content: welcome_string, files: [ATTACHMENT] }).catch(() => 'No message perms (probably)');
                
                return;
            }

            await WELCOMECHANNEL.send({ content: welcome_string }).catch(() => 'No message perms (probably)');

            return;
        }, 500);

        return;
    }
}