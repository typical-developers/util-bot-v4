import { BasicCard, type CardStyle, type UserInfo } from "../../util/Cards";

export class WelcomeCard extends BasicCard
{
    welcome_string: string

    public constructor(style: CardStyle, user: UserInfo, welcome_string: string)
    {
        super(970, 350, style, user);
        this.welcome_string = welcome_string;
    }

    public async draw()
    {
        await this.generateAvatar({ x: 404.5, y: 59, size: 161, has_status_ring: true });

        this.generateCenteredText(`Welcome, ${this.user.user.name}!`, {
            position: {
                y: 265
            },
            font: {
                size: 24,
                weight: 'bold',
                family: 'Gotham Bold'
            },
            color: this.style.colors.fontMain
        });
        this.generateCenteredText(this.welcome_string, {
            position: {
                y: 292
            },
            font: {
                size: 18,
                weight: 'medium',
                family: 'Gotham Medium'
            },
            color: this.style.colors.fontAlt
        });

        return this.out().then((o) => o);
    }
}