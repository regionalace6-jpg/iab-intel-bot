const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require("discord.js");
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

client.user.setActivity("Serving Lord Optic", {
type: ActivityType.Playing
});
});

client.on("messageCreate", async (message) => {

if (message.author.bot) return;

const mention = `<@${client.user.id}>`;

if (message.content.includes(mention) || message.channel.type === 1) {
message.reply("Yes Lord Optic. I am ready.");
}

if (message.content.toLowerCase().includes("hello bot")) {
message.reply("Greetings. Awaiting orders from Lord Optic.");
}

if (!message.content.startsWith(PREFIX)) return;

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

if (cmd === "help") {

const embed = new EmbedBuilder()
.setTitle("INTELLIGENCE COMMAND CENTER")
.setColor("Purple")
.setDescription(`
!help → show command list

!dlookup <user/id> → discord intelligence lookup

!rlookup <username> → roblox profile lookup

!osint <username> → username OSINT scan

!ip <ip> → ip intelligence lookup

!userinfo → show user information

!serverinfo → server information

!botinfo → bot system details

!ping → bot latency
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
.setDescription("Personal Intelligence System for **Lord Optic**");

message.reply({embeds:[embed]});
}

if (cmd === "userinfo") {

const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()
.setTitle("USER INTELLIGENCE")
.setThumbnail(user.displayAvatarURL({dynamic:true}))
.addFields(
{name:"Username", value:user.tag},
{name:"ID", value:user.id},
{name:"Bot", value:String(user.bot)},
{name:"Created", value:`<t:${parseInt(user.createdTimestamp/1000)}:F>`}
);

message.reply({embeds:[embed]});
}

if (cmd === "serverinfo" && message.guild) {

const g = message.guild;

const embed = new EmbedBuilder()
.setTitle("SERVER INTELLIGENCE")
.setThumbnail(g.iconURL())
.addFields(
{name:"Server", value:g.name},
{name:"Members", value:String(g.memberCount)},
{name:"Created", value:`<t:${parseInt(g.createdTimestamp/1000)}:R>`}
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
.addFields(
{name:"Username", value:u.name},
{name:"Display Name", value:u.displayName},
{name:"ID", value:String(u.id)},
{name:"Created", value:u.created}
)
.setURL(`https://roblox.com/users/${u.id}/profile`);

message.reply({embeds:[embed]});

} catch {
message.reply("Roblox lookup failed.");
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

if (cmd === "status" && message.author.id === OWNER) {

const text = args.join(" ");

client.user.setActivity(text, {type: ActivityType.Playing});

message.reply("Status updated.");
}

if (cmd === "say" && message.author.id === OWNER) {

message.channel.send(args.join(" "));
}

});

client.login(process.env.TOKEN);
