const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const dns = require('dns').promises;

const PREFIX = "!";
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once("ready", () => {
    console.log(`INTELLIGENCE DASHBOARD Online as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    try {

        // =========================
        // HELP
        // =========================
        if (command === "help") {
            const embed = new EmbedBuilder()
                .setTitle("🧠 INTELLIGENCE DASHBOARD")
                .setDescription("Full Command List")
                .addFields(
                    { name: "Roblox", value: "`!rbxuser` `!rbxid` `!rbxavatar` `!rbxbadges` `!rbxfriends`" },
                    { name: "Discord", value: "`!duser` `!dinfo` `!davatar` `!dcreated` `!dbanner`" },
                    { name: "IP / Domain", value: "`!iplookup` `!dnslookup` `!reverseip` `!portscan` `!geoip`" },
                    { name: "Email", value: "`!emailinfo` `!reverseemail` `!emaildomain` `!mxlookup` `!emailbreach`" },
                    { name: "OSINT", value: "`!metadata` `!blackvpn` `!hunter` `!shodan` `!urlscan`" }
                )
                .setColor("DarkButNotBlack");

            message.reply({ embeds: [embed] });
        }

        // =========================
        // ROBLOX COMMANDS
        // =========================
        if (command === "rbxuser") {
            const username = args[0];
            const res = await axios.post("https://users.roblox.com/v1/usernames/users", {
                usernames: [username]
            });
            message.reply(`User ID: ${res.data.data[0].id}`);
        }

        if (command === "rbxid") {
            const id = args[0];
            const res = await axios.get(`https://users.roblox.com/v1/users/${id}`);
            message.reply(`Username: ${res.data.name}`);
        }

        if (command === "rbxavatar") {
            const id = args[0];
            const res = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=420x420&format=Png`);
            message.reply(res.data.data[0].imageUrl);
        }

        if (command === "rbxbadges") {
            const id = args[0];
            const res = await axios.get(`https://badges.roblox.com/v1/users/${id}/badges?limit=5`);
            message.reply(`Badges Found: ${res.data.data.length}`);
        }

        if (command === "rbxfriends") {
            const id = args[0];
            const res = await axios.get(`https://friends.roblox.com/v1/users/${id}/friends/count`);
            message.reply(`Friends: ${res.data.count}`);
        }

        // =========================
        // DISCORD COMMANDS
        // =========================
        if (command === "duser") {
            const id = args[0];
            const user = await client.users.fetch(id);
            message.reply(`Username: ${user.tag}`);
        }

        if (command === "dinfo") {
            const id = args[0];
            const user = await client.users.fetch(id);
            message.reply(`Created: ${user.createdAt}`);
        }

        if (command === "davatar") {
            const id = args[0];
            const user = await client.users.fetch(id);
            message.reply(user.displayAvatarURL({ dynamic: true }));
        }

        if (command === "dcreated") {
            const id = args[0];
            const user = await client.users.fetch(id);
            message.reply(`Account Created: ${user.createdAt.toDateString()}`);
        }

        if (command === "dbanner") {
            message.reply("Banner requires privileged intent.");
        }

        // =========================
        // IP / DOMAIN
        // =========================
        if (command === "iplookup" || command === "geoip") {
            const ip = args[0];
            const res = await axios.get(`http://ip-api.com/json/${ip}`);
            message.reply(`${res.data.country}, ${res.data.city}`);
        }

        if (command === "dnslookup") {
            const domain = args[0];
            const records = await dns.lookup(domain);
            message.reply(`IP: ${records.address}`);
        }

        if (command === "reverseip") {
            message.reply("Reverse IP requires paid API.");
        }

        if (command === "portscan") {
            message.reply("Port scanning disabled on Railway.");
        }

        // =========================
        // EMAIL
        // =========================
        if (command === "emailinfo") {
            const email = args[0];
            const domain = email.split("@")[1];
            message.reply(`Domain: ${domain}`);
        }

        if (command === "reverseemail") {
            message.reply("Reverse email requires paid OSINT API.");
        }

        if (command === "emaildomain") {
            const email = args[0];
            message.reply(email.split("@")[1]);
        }

        if (command === "mxlookup") {
            const domain = args[0];
            const records = await dns.resolveMx(domain);
            message.reply(JSON.stringify(records));
        }

        if (command === "emailbreach") {
            message.reply("Breach check requires HaveIBeenPwned API key.");
        }

        // =========================
        // OSINT
        // =========================
        if (command === "metadata") {
            message.reply("Upload file to extract metadata (feature placeholder).");
        }

        if (command === "blackvpn") {
            message.reply("VPN detection requires external API.");
        }

        if (command === "hunter") {
            message.reply("Hunter.io requires API key.");
        }

        if (command === "shodan") {
            message.reply("Shodan requires API key.");
        }

        if (command === "urlscan") {
            message.reply("URLScan requires API key.");
        }

    } catch (err) {
        message.reply("Command failed. Check input.");
    }
});

client.login(process.env.TOKEN);
