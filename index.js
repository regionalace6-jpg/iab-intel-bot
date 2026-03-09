const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require("discord.js");
const fetch = require("node-fetch");
const sqlite3 = require("sqlite3").verbose();

const PREFIX = "!";
const OWNER = process.env.OWNER_ID;

const db = new sqlite3.Database("./data.db");

db.run(`CREATE TABLE IF NOT EXISTS grants (user TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS notes (text TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS tasks (text TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS messages (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user TEXT,
username TEXT,
content TEXT,
channel TEXT,
time INTEGER
)`);

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.DirectMessages
]
});

client.once("ready", ()=>{
console.log(`Online as ${client.user.tag}`);
client.user.setActivity("Serving Lord Optic",{type:ActivityType.Playing});
});

function isAuthorized(id){
return new Promise(resolve=>{
if(id===OWNER) return resolve(true);

db.get(`SELECT user FROM grants WHERE user=?`,[id],(err,row)=>{
resolve(!!row);
});
});
}

client.on("messageCreate",async message=>{

if(message.author.bot) return;

/* LOG MESSAGE */

db.run(
`INSERT INTO messages(user,username,content,channel,time) VALUES(?,?,?,?,?)`,
[
message.author.id,
message.author.tag,
message.content,
message.channel.id,
Date.now()
]
);

/* LIMIT TO 1000 */

db.run(`
DELETE FROM messages
WHERE id NOT IN (
SELECT id FROM messages ORDER BY id DESC LIMIT 1000
)
`);

if(message.mentions.has(client.user)){
message.reply("Yes Lord Optic.");
}

if(!message.content.startsWith(PREFIX)) return;

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

try{

/* HELP */

if(cmd==="help"){
message.reply(`
INTELLIGENCE
!dlookup
!rlookup
!osint
!ip

UTILITY
!userinfo
!serverinfo
!ping

HISTORY
!history @user
!channelhistory
!search keyword

ASSISTANT
!note add
!note list
!task add
!task list

PERMISSIONS
!grant
!revoke
!granted
`);
}

/* PING */

if(cmd==="ping"){
message.reply(`Latency: ${client.ws.ping}ms`);
}

/* USER INFO */

if(cmd==="userinfo"){

const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()
.setTitle("User Intelligence")
.setThumbnail(user.displayAvatarURL())
.addFields(
{name:"Username",value:user.tag},
{name:"ID",value:user.id},
{name:"Bot",value:String(user.bot)},
{name:"Created",value:`<t:${parseInt(user.createdTimestamp/1000)}:F>`}
);

message.reply({embeds:[embed]});
}

/* SERVER INFO */

if(cmd==="serverinfo" && message.guild){

const g = message.guild;

const embed = new EmbedBuilder()
.setTitle("Server Intelligence")
.addFields(
{name:"Server",value:g.name},
{name:"Members",value:String(g.memberCount)},
{name:"Created",value:`<t:${parseInt(g.createdTimestamp/1000)}:R>`}
);

message.reply({embeds:[embed]});
}

/* DISCORD LOOKUP */

if(cmd==="dlookup"){

let user;

if(message.mentions.users.first()){
user = message.mentions.users.first();
}else{
user = await client.users.fetch(args[0]).catch(()=>null);
}

if(!user) return message.reply("User not found.");

const embed = new EmbedBuilder()
.setTitle("Discord Lookup")
.setThumbnail(user.displayAvatarURL())
.addFields(
{name:"Username",value:user.tag},
{name:"ID",value:user.id},
{name:"Bot",value:String(user.bot)},
{name:"Created",value:`<t:${parseInt(user.createdTimestamp/1000)}:F>`}
);

message.reply({embeds:[embed]});
}

/* ROBLOX LOOKUP */

if(cmd==="rlookup"){

const username=args[0];
if(!username) return message.reply("Provide username.");

const res = await fetch(`https://users.roblox.com/v1/usernames/users`,{
method:"POST",
headers:{ "Content-Type":"application/json"},
body:JSON.stringify({usernames:[username]})
});

const data = await res.json();

if(!data.data.length) return message.reply("User not found.");

const id = data.data[0].id;

const userRes = await fetch(`https://users.roblox.com/v1/users/${id}`);
const user = await userRes.json();

const embed = new EmbedBuilder()
.setTitle("Roblox Lookup")
.addFields(
{name:"Username",value:user.name},
{name:"Display",value:user.displayName},
{name:"ID",value:String(user.id)},
{name:"Created",value:user.created}
)
.setURL(`https://roblox.com/users/${user.id}/profile`);

message.reply({embeds:[embed]});
}

/* OSINT */

if(cmd==="osint"){

const username = args[0];
if(!username) return message.reply("Provide username.");

message.reply(`
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
}

/* IP */

if(cmd==="ip"){

const ip = args[0];
if(!ip) return message.reply("Provide IP.");

const res = await fetch(`http://ip-api.com/json/${ip}`);
const data = await res.json();

message.reply(`
Country: ${data.country}
Region: ${data.regionName}
City: ${data.city}
ISP: ${data.isp}
`);
}

/* NOTES */

if(cmd==="note"){

if(args[0]==="add"){
db.run(`INSERT INTO notes(text) VALUES(?)`,[args.slice(1).join(" ")]);
message.reply("Note saved.");
}

if(args[0]==="list"){
db.all(`SELECT text FROM notes`,[],(err,rows)=>{
message.reply(rows.map(r=>r.text).join("\n") || "No notes.");
});
}

}

/* TASKS */

if(cmd==="task"){

if(args[0]==="add"){
db.run(`INSERT INTO tasks(text) VALUES(?)`,[args.slice(1).join(" ")]);
message.reply("Task added.");
}

if(args[0]==="list"){
db.all(`SELECT text FROM tasks`,[],(err,rows)=>{
message.reply(rows.map(r=>r.text).join("\n") || "No tasks.");
});
}

}

/* HISTORY */

if(cmd==="history"){

const user = message.mentions.users.first();
if(!user) return message.reply("Mention user.");

db.all(
`SELECT content,time FROM messages WHERE user=? ORDER BY time DESC LIMIT 10`,
[user.id],
(err,rows)=>{

if(!rows.length) return message.reply("No history.");

const text = rows.map(r=>`<t:${Math.floor(r.time/1000)}:R> - ${r.content}`).join("\n");

message.reply(text);
});
}

/* CHANNEL HISTORY */

if(cmd==="channelhistory"){

db.all(
`SELECT username,content FROM messages WHERE channel=? ORDER BY time DESC LIMIT 10`,
[message.channel.id],
(err,rows)=>{

if(!rows.length) return message.reply("No history.");

message.reply(rows.map(r=>`${r.username}: ${r.content}`).join("\n"));
});
}

/* SEARCH */

if(cmd==="search"){

const keyword = args.join(" ");

db.all(
`SELECT username,content FROM messages WHERE content LIKE ? LIMIT 10`,
[`%${keyword}%`],
(err,rows)=>{

if(!rows.length) return message.reply("No results.");

message.reply(rows.map(r=>`${r.username}: ${r.content}`).join("\n"));
});
}

/* GRANT */

if(cmd==="grant" && message.author.id===OWNER){

const user = message.mentions.users.first();
if(!user) return message.reply("Mention user.");

db.run(`INSERT INTO grants(user) VALUES(?)`,[user.id]);

message.reply("Access granted.");
}

/* REVOKE */

if(cmd==="revoke" && message.author.id===OWNER){

const user = message.mentions.users.first();
if(!user) return message.reply("Mention user.");

db.run(`DELETE FROM grants WHERE user=?`,[user.id]);

message.reply("Access revoked.");
}

/* GRANTED LIST */

if(cmd==="granted" && message.author.id===OWNER){

db.all(`SELECT user FROM grants`,[],(err,rows)=>{

if(!rows.length) return message.reply("No granted users.");

message.reply(rows.map(r=>`<@${r.user}>`).join("\n"));
});
}

}catch(err){
console.log(err);
message.reply("Command error.");
}

});

client.login(process.env.TOKEN);
