import { Subcommand } from "@sapphire/plugin-subcommands";
import { ApplyOptions } from "@sapphire/decorators";
import { APIApplicationCommandBasicOption, APIApplicationCommandOption, ApplicationCommandOptionType } from "discord.js";
import { Random } from '../../lib/util/Random';
import { isMessageInstance } from "@sapphire/discord.js-utilities";

@ApplyOptions<Subcommand.Options>({
    description: 'Get a funny plate',
    subcommands: [
        { name: 'from-user', chatInputRun: 'plateFromUser' }
    ]
})

export class GetPlateCommand extends Subcommand {
    readonly fromUserOptions: APIApplicationCommandBasicOption[] = [
        {
            type: ApplicationCommandOptionType.Number,
            name: 'user-id',
            description: 'The user plate you want to fetch.',
            required: true
        }
    ];

    readonly subcommandOptions: APIApplicationCommandOption[] = [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'from-user',
            description: 'Fetch a plate from a user\'s id.',
            options: this.fromUserOptions
        }
    ];

    readonly plateLetters: any[] = [
        "A", "B", "C", "D", "E", "F", "G", "H", 
        "I", "J", "K", "L", "M", "N", "O", "P",
        "Q", "R", "S", "T", "U", "V", "W", "X", 
        "Y", "Z", 1, 2, 3, 4, 5, 6, 7, 8, 9, 0
    ];

    public override registerApplicationCommands(registry: Subcommand.Registry): void
    {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: this.subcommandOptions
        });
    }

    public plateFromUser(interaction: Subcommand.ChatInputCommandInteraction): Promise<void>
    {
        const USERID = interaction.options.getNumber('user-id', true);
        const SEED = BigInt(USERID);
        const Rand = new Random(SEED);
        
        let text = ""
        for (let i = 1; i <= 6; i++) {
            let rand = Rand.random(1, this.plateLetters.length);
        
            text += this.plateLetters[rand - 1];
        
            if (i % 3 == 0 && i != 6) {
                text += " - ";
            }
        }

        interaction.reply({ content: text });
        
        return;
    }
}