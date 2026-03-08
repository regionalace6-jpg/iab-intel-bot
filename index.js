const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

const PREFIX = "!";
const OWNER = process.env.OWNER_ID;

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.DirectMessages
]
});

client.once("ready", () => {
console.log(`Online as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {

if (message.author.bot) return;

const mention = `<@${client.user.id}>`;

if (message.channel.type === 1 || message.content.includes(mention)) {
message.reply(`Yes **Lord Optic**. I am operational.`);
}

if (!message.content.startsWith(PREFIX)) return;

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

if (cmd === "help") {

const embed = new EmbedBuilder()
.setTitle("INTELLIGENCE COMMAND CENTER")
.setColor("Purple")
.setDescription(`
!help → show commands

!dlookup <user/id> → discord intelligence

!rlookup <username> → roblox intelligence

!osint <username> → username search

!ip <ip> → ip intelligence

!userinfo → user info

!serverinfo → server info

!botinfo → bot details

!ping → latency
`);

message.reply({embeds:[embed]});
}

if (cmd === "ping") {
message.reply(`Latency: ${client.ws.ping}ms`);
}

if (cmd === "botinfo") {

const embed = new EmbedBuilder()
.setTitle("BOT SYSTEM")
.setColor("Blue")
.setDescription(`Personal Intelligence AI for **Lord Optic**`);

message.reply({embeds:[embed]});
}

if (cmd === "serverinfo" && message.guild) {

const g = message.guild;

const embed = new EmbedBuilder()
.setTitle("SERVER INTELLIGENCE")
.setColor("Green")
.addFields(
{name:"Server", value:g.name},
{name:"Members", value:String(g.memberCount)},
{name:"Created", value:`<t:${parseInt(g.createdTimestamp/1000)}:R>`}
)
.setThumbnail(g.iconURL());

message.reply({embeds:[embed]});
}

if (cmd === "userinfo") {

const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()
.setTitle("USER INTELLIGENCE")
.setColor("Yellow")
.setThumbnail(user.displayAvatarURL({dynamic:true}))
.addFields(
{name:"Username", value:user.tag},
{name:"ID", value:user.id},
{name:"Bot", value:String(user.bot)},
{name:"Created", value:`<t:${parseInt(user.createdTimestamp/1000)}:F>`}
);

message.reply({embeds:[embed]});
}

if (cmd === "dlookup") {

let user;

if (message.mentions.users.first()) {
user = message.mentions.users.first();
} else {
user = await client.users.fetch(args[0]).catch(()=>null);
}

if (!user) return message.reply("User not found.");

const embed = new EmbedBuilder()
.setTitle("DISCORD LOOKUP")
.setColor("Blurple")
.setThumbnail(user.displayAvatarURL({dynamic:true}))
.addFields(
{name:"Username", value:user.tag},
{name:"ID", value:user.id},
{name:"Bot", value:String(user.bot)},
{name:"Created", value:`<t:${parseInt(user.createdTimestamp/1000)}:F>`}
)
.setURL(`https://discord.com/users/${user.id}`);

message.reply({embeds:[embed]});
}

if (cmd === "rlookup") {

const username = args[0];
if (!username) return message.reply("Provide username.");

try {

const res = await fetch(`https://api.roblox.com/users/get-by-username?username=${username}`);
const data = await res.json();

if (!data.Id) return message.reply("User not found.");

const user = await fetch(`https://users.roblox.com/v1/users/${data.Id}`);
const u = await user.json();

const embed = new EmbedBuilder()
.setTitle("ROBLOX LOOKUP")
.setColor("Red")
.addFields(
{name:"Username", value:u.name},
{name:"Display Name", value:u.displayName},
{name:"ID", value:String(u.id)},
{name:"Created", value:u.created}
)
.setURL(`https://roblox.com/users/${u.id}/profile`);

message.reply({embeds:[embed]});

} catch {
message.reply("Lookup failed.");
}
}

if (cmd === "ip") {

const ip = args[0];
if (!ip) return message.reply("Provide IP.");

try {

const res = await fetch(`http://ip-api.com/json/${ip}`);
const data = await res.json();

const embed = new EmbedBuilder()
.setTitle("IP INTELLIGENCE")
.setColor("Orange")
.addFields(
{name:"Country", value:data.country || "Unknown"},
{name:"Region", value:data.regionName || "Unknown"},
{name:"City", value:data.city || "Unknown"},
{name:"ISP", value:data.isp || "Unknown"}
);

message.reply({embeds:[embed]});

} catch {
message.reply("IP lookup failed.");
}
}

if (cmd === "osint") {

const username = args[0];
if (!username) return message.reply("Provide username.");

const embed = new EmbedBuilder()
.setTitle("USERNAME OSINT SCAN")
.setColor("DarkPurple")
.setDescription(`
GitHub → https://github.com/${username}

Reddit → https://reddit.com/user/${username}

Instagram → https://instagram.com/${username}

TikTok → https://tiktok.com/@${username}

X → https://x.com/${username}

YouTube → https://youtube.com/@${username}

Twitch → https://twitch.tv/${username}

Steam → https://steamcommunity.com/id/${username}

Roblox → https://roblox.com/users/profile?username=${username}
`);

message.reply({embeds:[embed]});
}

});

client.login(process.env.TOKEN);
