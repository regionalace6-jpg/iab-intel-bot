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

const notes = [];
const tasks = [];

client.once("ready", () => {
console.log(`Online as ${client.user.tag}`);
client.user.setActivity("Serving Lord Optic", { type: ActivityType.Playing });
});

client.on("messageCreate", async (message) => {

if (message.author.bot) return;

if (message.mentions.has(client.user)) {
message.reply("Yes Lord Optic. Awaiting instructions.");
}

if (!message.content.startsWith(PREFIX)) return;

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

try {

if (cmd === "help") {

const embed = new EmbedBuilder()
.setTitle("INTELLIGENCE COMMAND CENTER")
.setColor("Purple")
.setDescription(`
!help → command list

!dlookup <user/id> → discord lookup
!rlookup <username> → roblox lookup
!osint <username> → username search
!ip <ip> → ip intelligence

!userinfo → user info
!serverinfo → server info
!botinfo → bot info
!ping → latency

!note add <text>
!note list

!task add <text>
!task list

Owner:
!say
!status
`);

message.reply({ embeds:[embed] });
}

if (cmd === "ping") {
message.reply(`Latency: ${client.ws.ping}ms`);
}

if (cmd === "botinfo") {
message.reply("Personal intelligence assistant for **Lord Optic**.");
}

if (cmd === "userinfo") {

const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()
.setTitle("USER INTELLIGENCE")
.setThumbnail(user.displayAvatarURL())
.addFields(
{name:"Username", value:user.tag},
{name:"ID", value:user.id},
{name:"Bot", value:String(user.bot)},
{name:"Created", value:`<t:${parseInt(user.createdTimestamp/1000)}:F>`}
);

message.reply({ embeds:[embed] });
}

if (cmd === "serverinfo" && message.guild) {

const g = message.guild;

const embed = new EmbedBuilder()
.setTitle("SERVER INTELLIGENCE")
.addFields(
{name:"Server", value:g.name},
{name:"Members", value:String(g.memberCount)},
{name:"Created", value:`<t:${parseInt(g.createdTimestamp/1000)}:R>`}
);

message.reply({ embeds:[embed] });
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
.setThumbnail(user.displayAvatarURL())
.addFields(
{name:"Username", value:user.tag},
{name:"ID", value:user.id},
{name:"Bot", value:String(user.bot)},
{name:"Created", value:`<t:${parseInt(user.createdTimestamp/1000)}:F>`}
)
.setURL(`https://discord.com/users/${user.id}`);

message.reply({ embeds:[embed] });
}

if (cmd === "rlookup") {

const username = args[0];
if (!username) return message.reply("Provide username.");

const res = await fetch(`https://users.roblox.com/v1/usernames/users`, {
method:"POST",
headers:{ "Content-Type":"application/json" },
body: JSON.stringify({
usernames:[username],
excludeBannedUsers:false
})
});

const data = await res.json();

if (!data.data.length) return message.reply("User not found.");

const id = data.data[0].id;

const userRes = await fetch(`https://users.roblox.com/v1/users/${id}`);
const user = await userRes.json();

const embed = new EmbedBuilder()
.setTitle("ROBLOX LOOKUP")
.addFields(
{name:"Username", value:user.name},
{name:"Display", value:user.displayName},
{name:"ID", value:String(user.id)},
{name:"Created", value:user.created}
)
.setURL(`https://roblox.com/users/${user.id}/profile`);

message.reply({ embeds:[embed] });
}

if (cmd === "osint") {

const username = args[0];
if (!username) return message.reply("Provide username.");

const embed = new EmbedBuilder()
.setTitle("USERNAME OSINT")
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
NameMC → https://namemc.com/search?q=${username}
`);

message.reply({ embeds:[embed] });
}

if (cmd === "ip") {

const ip = args[0];
if (!ip) return message.reply("Provide IP.");

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

message.reply({ embeds:[embed] });
}

if (cmd === "note") {

if (args[0] === "add") {
notes.push(args.slice(1).join(" "));
return message.reply("Note saved.");
}

if (args[0] === "list") {
return message.reply(notes.join("\n") || "No notes.");
}

}

if (cmd === "task") {

if (args[0] === "add") {
tasks.push(args.slice(1).join(" "));
return message.reply("Task added.");
}

if (args[0] === "list") {
return message.reply(tasks.join("\n") || "No tasks.");
}

}

if (cmd === "say" && message.author.id === OWNER) {
message.channel.send(args.join(" "));
}

if (cmd === "status" && message.author.id === OWNER) {

client.user.setActivity(args.join(" "), {
type: ActivityType.Playing
});

message.reply("Status updated.");
}

} catch (err) {

console.error(err);
message.reply("Command error.");
}

});

client.login(process.env.TOKEN);
