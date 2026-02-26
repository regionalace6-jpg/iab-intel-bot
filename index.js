const { Client, GatewayIntentBits, EmbedBuilder, Collection } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = "!";

client.commands = new Collection();

/*
=====================================
 GOD MODE COMMAND SYSTEM
=====================================
*/

const commands = {

    ping: async (msg) => {
        msg.reply(`🏓 Pong ${client.ws.ping}ms`);
    },

    help: async (msg) => {

        msg.reply(`
🛡 GOD MODE COMMAND LIST

👤 User
!userinfo
!avatar
!whois
!mutuals

🎮 Roblox
!robloxinfo
!robloxid
!robloxavatar

🌍 OSINT
!iplookup
!geointel
!domaininfo

🚨 Security
!serverinfo
!raidstatus
!securityscan

🎯 Fun
!iq
!sigma
!drip
        `);

    },

    userinfo: async (msg, args) => {

        let user = msg.mentions.users.first() || msg.author;

        if (args[0]) {
            try {
                user = await client.users.fetch(args[0]);
            } catch {}
        }

        const days = Math.floor(
            (Date.now() - user.createdTimestamp) / 86400000
        );

        const embed = new EmbedBuilder()
            .setTitle("👤 GOD MODE USER INTEL")
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "User", value: user.tag },
                { name: "ID", value: user.id },
                { name: "Account Age", value: `${days} days` }
            );

        msg.reply({ embeds: [embed] });
    },

    avatar: async (msg) => {

        let user = msg.mentions.users.first() || msg.author;

        msg.reply(user.displayAvatarURL({ size: 512 }));
    },

    iplookup: async (msg, args) => {

        if (!args[0]) return msg.reply("Provide IP");

        try {

            const data = await fetch(
                `https://ipapi.co/${args[0]}/json/`
            ).then(r => r.json());

            const embed = new EmbedBuilder()
                .setTitle("🌍 IP Intelligence")
                .addFields(
                    { name: "City", value: data.city || "Unknown" },
                    { name: "Country", value: data.country_name || "Unknown" },
                    { name: "ISP", value: data.org || "Unknown" }
                );

            msg.reply({ embeds: [embed] });

        } catch {
            msg.reply("Lookup failed");
        }
    }

};

/*
=====================================
 MESSAGE HANDLER
=====================================
*/

client.on("messageCreate", async msg => {

    if (!msg.content.startsWith(PREFIX) || msg.author.bot) return;

    const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (commands[cmd]) {
        commands[cmd](msg, args);
    }

});

client.once("ready", () => {
    console.log(`🟥 GOD MODE ACTIVE | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
