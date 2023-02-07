import { APIEmbed } from "discord.js";
import { EmbedBuilder } from "@discordjs/builders";
import { colors, icons } from "../../config.json";

/**
  * Types:
  * 1 = Success
  * 2 = Warning
  * 3 = Error
  */
export async function statusEmbed(status: number, embed: APIEmbed): Promise<APIEmbed>
{
    switch (status)
    {
        case 1:
            embed.color = colors.green
            embed.author = { name: embed.title ?? 'Success!', icon_url: icons.success }
            break;
        case 2:
            embed.color = colors.orange
            embed.author = { name: embed.title ?? 'Are you sure?', icon_url: icons.warning }
            break;
        case 3:
            embed.color = colors.red
            embed.author = { name: embed.title ?? 'Ack! Something went wrong.', icon_url: icons.error }
            break;
        default: throw new Error(`${status} is not a valid type (must be 1, 2, 3)`)
    }

    delete embed.title;

    return new EmbedBuilder(embed).toJSON();
}