import { createCanvas, loadImage, registerFont, type Canvas, type CanvasRenderingContext2D } from 'canvas'; 
import { PresenceStatus } from 'discord.js';
// import { fillTextWithTwemoji } from 'node-canvas-with-twemoji'

export interface UserInfo
{
    user: {
        name: string,
        tag: string
    }
    avatar_url?: string
    status?: PresenceStatus
};

export interface CardStyle
{
    fonts?: {
        path?: string
        family?: string
        types?: Array<any[]>
    }
    background?: {
        type?: 'COLOR' | 'IMAGE'
        color?: string
        image?: string
    }
    background_alt?: string
    colors?: {
        fontMain?: string
        fontAlt?: string
    }
};

export interface RoundRectOptions
{
    x: number
    y: number
    width: number
    height: number
    radius: number
    color?: string,
    gradient?: any
};

export interface GenerateAvatarOptions
{
    x: number
    y: number
    size: number
    has_status_ring?: boolean
};

export interface GenerateTextOptions
{
    position?: {
        x?: number
        y?: number
    }
    font: {
        size: number,
        weight: string,
        family: string
    }
    color: string
}

export class BasicCard
{
    canvas: Canvas
    context: CanvasRenderingContext2D
    style: CardStyle
    user: UserInfo
    avatar_cache: object

    public constructor(width: number, height: number, style: CardStyle, user: UserInfo)
    {
        this.canvas = createCanvas(width, height);
        this.context = this.canvas.getContext('2d');

        const DEFAULTSTYLE: CardStyle = {
            fonts: {
                path: 'src/assets/fonts',
                types: [
                    ['Gotham Medium', 'Gotham Medium.otf', ''],
                    ['Gotham Bold', 'Gotham Bold.otf', 'bold']
                ]
            },
            background: {
                type: 'COLOR',
                color: '#201E29'
            },
            background_alt: '#15141B',
            colors: {
                fontMain: '#F0F4FF',
                fontAlt: '#808098'
            }
        };
        this.style = this.objectAssign(DEFAULTSTYLE, style);

        const DEFAULTDETAILS: UserInfo = {
            user: null,
            avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
            status: 'offline'
        }
        this.user = this.objectAssign(DEFAULTDETAILS, user);

        if (this.style.fonts)
        {
            this.loadFonts();
        }

        this.roundRect({
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height,
            radius: 20,
            color: this.style.background.color
        });

        this.roundRect({
            x: 30,
            y: 30,
            width: this.canvas.width - 60,
            height: this.canvas.height - 60,
            radius: 15,
            color: this.style.background_alt
        });
    };

    public loadFonts()
    {
        const { fonts } = this.style;

        for (let [font_famnily, font_file, font_weight] of Object.values(fonts.types))
        {
            registerFont(`${fonts.path}/${font_file}`, { family: font_famnily, weight: font_weight });
        }
    }

    public roundRect(options: RoundRectOptions)
    {
        const { context } = this;
        if (!context) throw new Error('No context was given.');

        context.beginPath();
        context.moveTo(options.x + options.radius, options.y);
        context.lineTo(options.x + options.width - options.radius, options.y);
        context.quadraticCurveTo(options.x + options.width, options.y, options.x + options.width, options.y + options.radius);
        context.lineTo(options.x + options.width, options.y + options.height - options.radius);
        context.quadraticCurveTo(options.x + options.width, options.y + options.height, options.x + options.width - options.radius, options.y + options.height);
        context.lineTo(options.x + options.radius, options.y + options.height);
        context.quadraticCurveTo(options.x, options.y + options.height, options.x, options.y + options.height - options.radius);
        context.lineTo(options.x, options.y + options.radius);
        context.quadraticCurveTo(options.x, options.y, options.x + options.radius, options.y);
        if (options?.color) {
            context.strokeStyle = options.color;
            context.fillStyle = options.color;
            context.stroke();
            context.fill();
        }
        if (options?.gradient) {
            const { x0, y0, x1, y1, color_stops } = options.gradient;

            const GRADIENT = context.createLinearGradient(x0, y0, x1 + options.width, y1);
            color_stops.forEach((point: any) => {
                GRADIENT.addColorStop(point[0], point[1]);
            });

            context.strokeStyle = GRADIENT;
            context.fillStyle = GRADIENT;
            context.stroke();
            context.fill();
        }
        context.closePath();
    
        return this;
    }

    public async generateAvatar(options: GenerateAvatarOptions)
    {
        const { context } = this;

        const AVATARURL = this.user.avatar_url;
        // const AVATAR = avatar_cache[AVATARURL]
        //     ? avatar_cache[AVATARURL]
        //     : avatar_cache[AVATARURL] = await loadImage(AVATARURL).catch(async () => {
        //         return await loadImage('https://cdn.discordapp.com/embed/avatars/0.png')
        //     });
        const AVATAR = await loadImage(AVATARURL).catch(async () => {
            return await loadImage('https://cdn.discordapp.com/embed/avatars/0.png')
        });

        if (!AVATAR) throw new Error('There was an issue generating the avatar.');
        context.beginPath()
        context.save();
        context.arc(options.x + options.size / 2, options.y + options.size / 2, options.size / 2, 0, 4*Math.PI, true);
        context.closePath();
        context.clip();
        context.drawImage(AVATAR, options.x, options.y, options.size, options.size);
        context.restore();

        if (options.has_status_ring) {
            const COLORS = { offline: "#727D8A", online: "#3BA55D", dnd: "#ED4245", idle: "#FAA81A" };
            
            if (!this.user.status) this.user.status = 'offline';

            context.lineWidth = 4;
            context.strokeStyle = COLORS[this.user.status];
            context.beginPath();
            context.arc(options.x + options.size / 2, options.y + options.size / 2, (options.size / 2) + 6, 0, 4*Math.PI, true);
            context.stroke();
            context.closePath();
        }

        return this;
    }

    public async out()
    {
        return this.canvas.toBuffer();
    }

    public generateText(text: any, side: string, options: GenerateTextOptions)
    {
        const { context } = this;

        context.font = `${options.font.weight} ${options.font.size}px ${options.font.family}`;
        context.fillStyle = options.color;

        const TEXTWIDTH = context.measureText(text).width;

        if (side == 'right')
        {
            context.fillText(text, this.canvas.width - TEXTWIDTH - options.position.x, options.position.y);
            return TEXTWIDTH;
        }

        context.fillText(text, options.position.x, options.position.y);
        return TEXTWIDTH;
    }

    public generateCenteredText(text: any, options: GenerateTextOptions)
    {
        const { context } = this;

        context.font = `${options.font.weight} ${options.font.size}px ${options.font.family}`;
        context.fillStyle = options.color;
        context.textAlign = "center";
        
        const TEXTWIDTH = context.measureText(text).width;

        context.fillText(text, this.canvas.width / 2, options.position.y);

        return TEXTWIDTH;
    }

    public objectAssign(target: object, ...sources: object[]): any
    {
        sources.forEach((source) =>
        {
            Object.keys(source).forEach((key) => 
            {
                const TARGETVAL = target[key];
                const SOURCEVAL = source[key];
    
                target[key] = TARGETVAL && SOURCEVAL && typeof TARGETVAL == 'object' && typeof SOURCEVAL == 'object' ? this.objectAssign(TARGETVAL, SOURCEVAL) : SOURCEVAL;
            });
        });
    
        return target;
    }
}