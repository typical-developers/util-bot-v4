import { Command } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { APIApplicationCommandBasicOption, ApplicationCommandOptionType, codeBlock, EmbedBuilder } from "discord.js";
import { colors } from "../../config.json";

@ApplyOptions<Command.Options>({
    description: 'Ask the magic 8ball a question.'
})

export class Magic8ballCommand extends Command {
    readonly magic8ballOptions: APIApplicationCommandBasicOption[] = [
        {
            type: ApplicationCommandOptionType.String,
            name: 'question',
            description: 'What would you like to ask the magic 8bal?',
            required: true
        }
    ];

    public override registerApplicationCommands(registry: Command.Registry)
    {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: this.magic8ballOptions,
            dmPermission: true
        });
    }
    
    private randomizedResponse(): string
    {
        const RESPONSES = [
            "As I see it, yes.",
            "Ask again later.",
            "Better not tell you now.",
            "Cannot predict now.",
            "Concentrate and ask again.",
            "Don’t count on it.",
            "It is certain.",
            "It is decidedly so.",
            "Most likely.",
            "My reply is no.",
            "My sources say no.",
            "Outlook not so good.",
            "Outlook good.",
            "Reply hazy, try again.",
            "Signs point to yes.",
            "Very doubtful.",
            "Without a doubt.",
            "Yes.",
            "Yes – definitely.",
            "You may rely on it."
        ];

        return RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
    }

    public override chatInputRun(interaction: Command.ChatInputCommandInteraction): void
    {        
        const QUESTION = interaction.options.getString('question');
        if (QUESTION.length > 1010)
        {
            interaction.reply({ content: `Question length exceeds character limit (${QUESTION.length} / 1010).`, ephemeral: true });
            return;
        }

        const EMBED = new EmbedBuilder({
            color: colors.accent,
            title: '🎱 Magic 8ball',
            fields: [
                { name: `${interaction.user.tag} asks`, value: codeBlock('', QUESTION) },
                { name: `8ball Responds`, value: codeBlock('', this.randomizedResponse()) }
            ],
            timestamp: `${new Date()}`
        });

        interaction.reply({ embeds: [EMBED] });

        return;
    }
}