import { Listener } from '@sapphire/framework';
import { Client, Collection, Guild, ActivityType } from 'discord.js';
import axios from 'axios';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<Listener.Options>({
    name: 'ready',
    once: true
})

export class ReadyListener extends Listener {
    /**
     * Fetches the total amount of members from each guild and adds them up.
     * @returns {Promise<number>} Total members found across guilds.
     */
    private async getTotalMemberCount(guilds: Collection<string, Guild>): Promise<number>
    {
        let members = 0;

        guilds.forEach((guild: Guild) =>
        {
            members += guild.memberCount;
        });

        return members;
    }

    public async run(client: Client): Promise<any>
    {
        const { get } = axios;
        let oldPlaying: number = 0;

        return setInterval(async () =>
        {
            let currentPlaying = await get('https://www.roblox.com/places/api-get-details?assetId=9938675423').then((res) => res.data?.OnlineCount).catch(() => oldPlaying);

            if (currentPlaying && currentPlaying !== oldPlaying)
            {
                client.user.setPresence({ activities: [{ name: `Oaklands・${currentPlaying} playing`, type: ActivityType.Watching }] });
                oldPlaying = currentPlaying;
            }
        }, 5000);
    }
}