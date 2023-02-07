import { Command } from "@sapphire/framework";
import { isMessageInstance } from "@sapphire/discord.js-utilities";
import { ApplyOptions } from "@sapphire/decorators";
import {
    ApplicationCommandOptionType,
    codeBlock,
    inlineCode,
    PermissionFlagsBits,
    AttachmentBuilder,
    APIApplicationCommandOption
} from "discord.js";
import { VM } from "vm2";
import { inspect } from "util";
import { eval_access } from "../../config.json";
import { statusEmbed } from "../../lib/util/Embeds";

// importing everything that i'd want to use with eval
// i'm aware this probably isn't the best way to do things, so feel free to scream at me
// ..tho, fix it up as well if you know how to do it better.
import * as discordjs from 'discord.js';
import * as config from '../../config.json';

@ApplyOptions<Command.Options>({
    description: 'Authorized users only. Be careful when not running the command silently in a public chat.'
})

export class EvalCommand extends Command {
    readonly evaloptions: APIApplicationCommandOption[] = [
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'ephemeral',
            description: 'Whether this command will visible in chat.',
            required: true
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'file-out',
            description: 'Whether or not the output should be put into a file.',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'code',
            description: 'The code you want to execute.',
            required: true
        }
    ]
    
    public override registerApplicationCommands(registry: Command.Registry): void
    {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: this.evaloptions,
            defaultMemberPermissions: PermissionFlagsBits.Administrator
        },
        {
            guildIds: process.env.NODE_ENV == "production"
             ? [ '865737627712749579', '893717531179769887', '1067144248463466526' ]
             : [ '1019036016381788190' ]
        });
    }

    private async clean(text: any): Promise<string>
    {
        if (text && text.constructor.name == "Promise")
            text = await text;
        
        if (typeof text !== "string")
            text = inspect(text, { depth: 1 });
        
        text = text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));

        return text;
    }

    private async eval(interaction: Command.ChatInputCommandInteraction, options: { silent: boolean, file_out: boolean, code: string }): Promise<void>
    {
        let { silent, file_out, code } = options;
        let { client } = this.container;
        
        const DEFERREPLY = await interaction.deferReply({ ephemeral: silent, fetchReply: true });
        const RANMS = new Date().getTime();

        const SANDBOX = new VM({
            sandbox: {
                interaction: interaction,
                client: client, // it is probably *very* dangerous to do this..
                util: {
                    discordjs: discordjs,
                    config: config
                }
            }
        });

        try {
            const EVAL = await SANDBOX.run(code);
            const CLEANED = await this.clean(EVAL);
            const EVALED = await statusEmbed(1, {
                fields: [
                    { name: 'Took', value: inlineCode(`${new Date().getTime() - RANMS}ms`), inline: true },
                    { name: 'Type', value: inlineCode(typeof EVAL), inline: true },
                    { name: 'Input', value: codeBlock('js', code.slice(0, 1010)) },
                    { name: 'Output', value: codeBlock('js', CLEANED.slice(0, 1010)) }
                ],
                timestamp: `${new Date()}`
            });

            // This returns the cleaned code as an output.js file instead.
            // It also removes the "Output" field from EMBED.
            // This probably isn't done in the most optimal way.
            if (file_out && isMessageInstance(DEFERREPLY))
            {
                EVALED.fields.splice(3, 1);

                await interaction.editReply({ embeds: [EVALED] });
                await interaction.followUp({ files: [new AttachmentBuilder(Buffer.from(CLEANED, 'utf-8'), { name: 'output.js' })], ephemeral: silent });

                return;
            }

            if (isMessageInstance(DEFERREPLY))
                await interaction.editReply({ embeds: [EVALED] });
        } catch (err) {
            const ERROR = await statusEmbed(3, {
                fields: [
                    { name: 'Took', value: inlineCode(`${new Date().getTime() - RANMS}ms`), inline: true },
                    { name: 'Input', value: codeBlock('js', code.slice(0, 1010)) },
                    { name: 'Error', value: codeBlock('xl', err) }
                ],
                timestamp: `${new Date()}`
            });

            if (isMessageInstance(DEFERREPLY))
                interaction.editReply({ embeds: [ERROR] });

            throw new Error(err);
        }

        return;
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<void>
    {
        if (eval_access.includes(interaction.user.id))
        {
            const OPTIONS = {
                silent: interaction.options.getBoolean('ephemeral', true),
                file_out: interaction.options.getBoolean('file-out', true),
                code: interaction.options.getString('code', true)
            };
            await this.eval(interaction, OPTIONS);

            return;
        }

        this.container.logger.warn(` ${interaction.user.tag} (${interaction.user.id}) has attempted to run the eval command in ${interaction.guild.name} (${interaction.guild.id}).`);
        interaction.reply({ ephemeral: true, content: '🚫 You are not authorized to run the eval command. This has been logged.' });

        return;
    }
}