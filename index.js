const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require("discord.js");
const fetch = require("node-fetch");
const { Pool } = require("pg");

const PREFIX = "!";
const OWNER = process.env.OWNER_ID;

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: { rejectUnauthorized: false }
});

async function initDB(){

await pool.query(`
CREATE TABLE IF NOT EXISTS grants(
user_id TEXT PRIMARY KEY
)
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS notes(
id SERIAL PRIMARY KEY,
text TEXT
)
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS tasks(
id SERIAL PRIMARY KEY,
text TEXT
)
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS messages(
id SERIAL PRIMARY KEY,
user_id TEXT,
username TEXT,
content TEXT,
channel_id TEXT,
time BIGINT
)
`);

}

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.DirectMessages
]
});

client.once("ready",async ()=>{
console.log(`Online as ${client.user.tag}`);
client.user.setActivity("Serving Lord Optic",{type:ActivityType.Playing});
await initDB();
});

async function isAuthorized(id){

if(id === OWNER) return true;

const res = await pool.query(
`SELECT user_id FROM grants WHERE user_id=$1`,
[id]
);

return res.rows.length > 0;

}

client.on("messageCreate",async message=>{

if(message.author.bot) return;

/* LOG MESSAGE */

await pool.query(
`INSERT INTO messages(user_id,username,content,channel_id,time)
VALUES($1,$2,$3,$4,$5)`,
[
message.author.id,
message.author.tag,
message.content,
message.channel.id,
Date.now()
]
);

/* LIMIT 1000 MESSAGES */

await pool.query(`
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

/* GRANT */

if(cmd==="grant" && message.author.id===OWNER){

const user = message.mentions.users.first();
if(!user) return message.reply("Mention user.");

await pool.query(
`INSERT INTO grants(user_id) VALUES($1) ON CONFLICT DO NOTHING`,
[user.id]
);

message.reply("Access granted.");

}

/* REVOKE */

if(cmd==="revoke" && message.author.id===OWNER){

const user = message.mentions.users.first();
if(!user) return message.reply("Mention user.");

await pool.query(
`DELETE FROM grants WHERE user_id=$1`,
[user.id]
);

message.reply("Access revoked.");

}

/* GRANTED LIST */

if(cmd==="granted" && message.author.id===OWNER){

const res = await pool.query(`SELECT user_id FROM grants`);

if(!res.rows.length) return message.reply("No users granted.");

message.reply(res.rows.map(r=>`<@${r.user_id}>`).join("\n"));

}

/* NOTE */

if(cmd==="note"){

if(args[0]==="add"){

const text = args.slice(1).join(" ");

await pool.query(
`INSERT INTO notes(text) VALUES($1)`,
[text]
);

message.reply("Note saved.");

}

if(args[0]==="list"){

const res = await pool.query(`SELECT text FROM notes`);

message.reply(res.rows.map(r=>r.text).join("\n") || "No notes.");

}

}

/* TASK */

if(cmd==="task"){

if(args[0]==="add"){

const text = args.slice(1).join(" ");

await pool.query(
`INSERT INTO tasks(text) VALUES($1)`,
[text]
);

message.reply("Task added.");

}

if(args[0]==="list"){

const res = await pool.query(`SELECT text FROM tasks`);

message.reply(res.rows.map(r=>r.text).join("\n") || "No tasks.");

}

}

/* HISTORY */

if(cmd==="history"){

const user = message.mentions.users.first();
if(!user) return message.reply("Mention user.");

const res = await pool.query(
`SELECT content,time FROM messages
WHERE user_id=$1
ORDER BY time DESC
LIMIT 10`,
[user.id]
);

if(!res.rows.length) return message.reply("No history.");

const text = res.rows.map(r=>
`<t:${Math.floor(r.time/1000)}:R> - ${r.content}`
).join("\n");

message.reply(text);

}

/* CHANNEL HISTORY */

if(cmd==="channelhistory"){

const res = await pool.query(
`SELECT username,content
FROM messages
WHERE channel_id=$1
ORDER BY time DESC
LIMIT 10`,
[message.channel.id]
);

if(!res.rows.length) return message.reply("No history.");

message.reply(res.rows.map(r=>`${r.username}: ${r.content}`).join("\n"));

}

/* SEARCH */

if(cmd==="search"){

const keyword = args.join(" ");

const res = await pool.query(
`SELECT username,content
FROM messages
WHERE content ILIKE $1
LIMIT 10`,
[`%${keyword}%`]
);

if(!res.rows.length) return message.reply("No results.");

message.reply(res.rows.map(r=>`${r.username}: ${r.content}`).join("\n"));

}

}catch(err){

console.log(err);
message.reply("Command error.");

}

});

client.login(process.env.TOKEN);
