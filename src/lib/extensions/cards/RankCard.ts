import { BasicCard, type CardStyle, type UserInfo } from "../../util/Cards";

export interface ActivityInfo
{
    rank: number
    rating: string
    points: {
        progress: number
        required: number
    }
};

export class RankCard extends BasicCard
{
    activity_details: ActivityInfo

    public constructor(style: CardStyle, user: UserInfo)
    {
        super(940, 300, style, user);
    }

    private progressBar(current_progress: number, required_points: number)
    {
        let percentage = Math.min(Math.max(current_progress / required_points, 0.025), 1);

        // main
        this.roundRect({
            x: 275,
            y: 193.5,
            width: 580,
            height: 6,
            radius: 3,
            color: '#4C4C54'
        });

        // progress amount
        if (percentage <= 0) return this;
        this.roundRect({
            x: 274,
            y: 190.5,
            width: percentage * 581,
            height: 12,
            radius: 7,
            gradient: {
                x0: 275,
                y0: 275,
                x1: 275,
                y1: 275,
                color_stops: [
                    [0, "#1841d4"],
                    [100, "#f726c9"]
                ]
            }
        });

        return this;
    }

    public async setActivityInfo(info: ActivityInfo)
    {
        this.activity_details = info;

        return this;
    }

    public async draw()
    {
        if (!this.activity_details) throw new Error('You did not provide user activity details.');

        await this.generateAvatar({ x: 82, y: 69.5, size: 161, has_status_ring: true });

        this.generateText('User', 'left', {
            position: {
                x: 275,
                y: 109.5
            },
            font: {
                size: 18,
                weight: 'bold',
                family: 'Gotham Bold'
            },
            color: this.style.colors.fontMain
        });
        const USERNAME = this.generateText(this.user.user.name.substring(0, 16) + `${this.user.user.name.length >= 16 ? "..." : ''}`, 'left', {
            position: {
                x: 275,
                y: 137.5
            },
            font: {
                size: 24,
                weight: 'medium',
                family: 'Gotham Medium'
            },
            color: this.style.colors.fontMain
        });
        this.generateText(`#${this.user.user.tag}`, 'left', {
            position: {
                x: 275 + USERNAME + 2,
                y: 137.5
            },
            font: {
                size: 24,
                weight: 'medium',
                family: 'Gotham Medium'
            },
            color: this.style.colors.fontAlt
        });

        this.generateText('Rank', 'right', {
            position: {
                x: 86,
                y: 109.5
            },
            font: {
                size: 18,
                weight: 'bold',
                family: 'Gotham Bold'
            },
            color: this.style.colors.fontMain
        });

        const RANKCOLORS = { 1: '#65e1ec', 2: '#e9b029', 3: '#da6130' }
        this.generateText(`#${this.activity_details.rank}`, 'right', {
            position: {
                x: 86,
                y: 137.5
            },
            font: {
                size: 24,
                weight: 'medium',
                family: 'Gotham Medium'
            },
            color: RANKCOLORS[this.activity_details.rank] ? RANKCOLORS[this.activity_details.rank] : this.style.colors.fontMain
        });

        this.generateText(this.activity_details.rating, 'left', {
            position: {
                x: 275,
                y: 177.5
            },
            font: {
                size: 18,
                weight: 'medium',
                family: 'Gotham Medium'
            },
            color: this.style.colors.fontMain
        });
        this.generateText(this.activity_details.points.progress < this.activity_details.points.required ? `${this.activity_details.points.progress} / ${this.activity_details.points.required}` :  `${this.activity_details.points.progress}`, 'right', {
            position: {
                x: 86,
                y: 177.5
            },
            font: {
                size: 18,
                weight: 'medium',
                family: 'Gotham Medium'
            },
            color: this.style.colors.fontMain
        });
        this.progressBar(this.activity_details.points.progress, this.activity_details.points.required);

        return this.out().then((o) => o);
    }
}