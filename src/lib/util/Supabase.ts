import { SupabaseClient } from "@supabase/supabase-js";
const { URL, SERVICE_ROLE } = JSON.parse(process.env.SUPABASE);

export interface ActivityPointsDatabaseOptions {
    guildId: string,
    userId?: string
}

export interface ActivityPointsDatabaseReturnValues {
    old: number,
    new: number
}

export class ActivityPointsDatabase extends SupabaseClient {
    options: ActivityPointsDatabaseOptions
    data: any

    constructor(options: ActivityPointsDatabaseOptions)
    {
        super(URL, SERVICE_ROLE);
        this.options = options;
    }

    public async init()
    {
        let { guildId, userId } = this.options;

        const { data, error } = await this.from('points').select('*').eq('server_id', guildId).eq('user_id', userId);
        if (error) throw error;
        if (Object.keys(data).length = 0) return undefined;

        this.data = data[0];
        return this;
    }

    public async getGuildLeaderboard(limit: number)
    {
        let { guildId } = this.options;

        const { data, error } = await this.from('points').select('user_id, amount').eq('server_id', guildId).order('amount', { ascending: false }).limit(limit);
        if (error) throw error;
        if (Object.keys(data).length <= 0) return false;

        return data;
    }

    public async updateUserPoints(addAmount: number)
    {
        let { guildId, userId } = this.options;
        
        const { data, error } = await this.from('points').select('server_id, user_id, amount').eq('server_id', guildId).eq('user_id', userId);
        if (error) throw error;
        
        const LATSRAN = Math.floor(new Date().getTime() / 1000);

        // If the user has no data, it will make a new entry in the table.
        if (Object.keys(data).length <= 0) {
            await this.from('points').insert({
                server_id: guildId,
                user_id: userId,
                amount: addAmount,
                last_ran: LATSRAN
            });

            return { old: 0, new: addAmount };
        }

        // Otherwise, it'll update the extisting entry.
        await this.from('points').update({
            amount: data[0].amount + addAmount,
            last_ran: LATSRAN
        }).eq('user_id', userId).eq('server_id', guildId);

        return { old: data[0].amount, new: data[0].amount + addAmount };
    }

    public async getUserRank()
    {
        let { guildId, userId } = this.options;

        const { data, error } = await this.from('points').select('user_id').eq('server_id', guildId).order('amount', { ascending: false });
        if (error) throw error;
        if (Object.keys(data).length <= 0) return -1;

        const INDEX = data.findIndex(({ user_id }) => user_id == userId);
        if (!data[INDEX]) return -1;

        return INDEX + 1;
    }

    public isOnCooldown(cooldownMS: number)
    {
        if (!this.data) return false;

        if (this.data.last_ran + cooldownMS > Math.floor(new Date().getTime() / 1000)) return true;
        return false;
    }
}

export interface GuildSettingsDatabaseOptions {
    guildId: string
}

export interface GuildSettingsDatabaseSchema {
    server_id?: string,
    points_system?: boolean,
    activity_roles?: Array<object[]>,
    welcome_notifs?: boolean,
    welcome_channel?: string,
    welcome_string?: string,
    welcome_card?: boolean
}

export class GuildSettingsDatabase extends SupabaseClient {
    options: GuildSettingsDatabaseOptions
    guild_settings: GuildSettingsDatabaseSchema

    constructor(options: GuildSettingsDatabaseOptions)
    {
        super(URL, SERVICE_ROLE);
        this.options = options;
    }

    /**
     * Fetches guild settings. This function must be ran when creating a new class.
     */
    public async init(): Promise<this>
    {
        const { data, error } = await this.from('guild-settings').select().eq('server_id', this.options.guildId);
        if (error) throw error;
        if (Object.keys(data).length <= 0) return this;

        this.guild_settings = data[0];
        return this;
    }

    /**
     * Checks if the guild has leveling enabled.
     */
    public hasPointsEnabled(): boolean
    {
        return this?.guild_settings?.points_system;
    }

    /**
     * Gets all of the level roles available for the guild.
     */
    public getActivityRoles(): any[]
    {
        let { activity_roles } = this.guild_settings;
        if (activity_roles.length == 0) return [];

        const LEVELROLES = [];
        for (let [level, roleId] of Object.values(activity_roles))
        {
            LEVELROLES.push({ points_required: level, role_id: roleId });
        }

        return LEVELROLES;
    }

    public hasWelcomeNotifsEnabled()
    {
        return this?.guild_settings?.welcome_notifs;
    }

    public getWelcomeChannel()
    {
        return this?.guild_settings?.welcome_channel;
    }

    public getWelcomeString()
    {
        return this?.guild_settings?.welcome_string;
    }

    public hasWelcomeCardEnabled()
    {
        return this?.guild_settings?.welcome_card
    }
}