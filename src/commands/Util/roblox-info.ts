import { Subcommand } from "@sapphire/plugin-subcommands";
import { ApplyOptions } from "@sapphire/decorators";
import { APIApplicationCommandBasicOption, APIApplicationCommandOption, ApplicationCommandOptionType } from "discord.js";

@ApplyOptions<Subcommand.Options>({
    description: 'Get some information relating to the bot.',
    subcommands: [
        { name: 'user', chatInputRun: 'robloxUser' },
        { name: 'group', chatInputRun: 'robloxGroup' }
    ],
    enabled: false
})

export class RobloxInfoCommand extends Subcommand {
    readonly userInfoOptions: APIApplicationCommandBasicOption[] = [
        {
            type: ApplicationCommandOptionType.Number,
            name: 'user-id',
            description: 'The user that you want to fetch.',
            required: true
        }
    ];

    readonly groupInfoOptions: APIApplicationCommandBasicOption[] = [
        {
            type: ApplicationCommandOptionType.Number,
            name: 'user-id',
            description: 'The user that you want to fetch.',
            required: true
        }
    ];

    readonly subcommandOptions: APIApplicationCommandOption[] = [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'user',
            description: 'Fetch the information for a user.',
            options: this.userInfoOptions
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'group',
            description: 'Fetch the information for a group.',
            options: this.groupInfoOptions
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

    public async robloxuser()
    {

    }

    public async robloxGroup()
    {
        
    }
}