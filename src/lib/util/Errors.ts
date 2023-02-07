import { codeBlock, inlineCode, WebhookClient } from "discord.js";
import { statusEmbed } from "./Embeds";

export async function handleErrors(type: string)
{
    process.on(type, async (error, origin) => {
        if (origin.constructor.name == "Promise")
            origin = await origin;

        const WEBHOOK = new WebhookClient({ id: '', token: '' });
        const EMBED = await statusEmbed(3, {
            title: 'The bot has encountered an error.',
            fields: [
                { name: 'Type', value: inlineCode(type), inline: true },
                { name: 'Environment', value: inlineCode(process.env.NODE_ENV), inline: true },
                { name: 'Error', value: codeBlock('js', error) },
                { name: 'Origin', value: codeBlock('js', origin) }
            ],
            timestamp: `${new Date()}`
        });

        WEBHOOK.send({ embeds: [EMBED] });

        console.log(error, origin);
    });
}