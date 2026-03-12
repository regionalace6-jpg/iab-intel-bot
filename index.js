const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require("discord.js")
const fetch = require("node-fetch")
const moment = require("moment")
const { Pool } = require("pg")

const PREFIX = "!"
const OWNER = process.env.OWNER_ID

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl:{rejectUnauthorized:false}
})

/* EMBED */

function ui(title,desc){
return new EmbedBuilder()
.setColor("#6a00ff")
.setTitle(title)
.setDescription(desc||"")
.setFooter({text:"Optic Intelligence System • Serving Lord Optic"})
.setTimestamp()
}

/* CLIENT */

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
})

/* DATABASE */

async function initDB(){

await pool.query(`
CREATE TABLE IF NOT EXISTS grants(
user_id TEXT PRIMARY KEY
)`)

await pool.query(`
CREATE TABLE IF NOT EXISTS messages(
id SERIAL PRIMARY KEY,
user_id TEXT,
username TEXT,
content TEXT,
channel_id TEXT,
time BIGINT
)`)

await pool.query(`
CREATE TABLE IF NOT EXISTS notes(
id SERIAL PRIMARY KEY,
text TEXT
)`)

await pool.query(`
CREATE TABLE IF NOT EXISTS tasks(
id SERIAL PRIMARY KEY,
text TEXT
)`)

}

/* READY */

client.once("ready",async()=>{

console.log(`Online → ${client.user.tag}`)

client.user.setActivity("Serving Lord Optic",{type:ActivityType.Playing})

await initDB()

})

/* PERMISSION */

async function hasAccess(id){

if(id===OWNER) return true

const res = await pool.query(
`SELECT user_id FROM grants WHERE user_id=$1`,
[id]
)

return res.rows.length>0
}

/* MESSAGE EVENT */

client.on("messageCreate",async message=>{

if(message.author.bot) return

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
)

/* LIMIT */

await pool.query(`
DELETE FROM messages
WHERE id NOT IN(
SELECT id FROM messages ORDER BY id DESC LIMIT 1000
)
`)

/* MENTION */

if(message.mentions.has(client.user)){
return message.reply("Yes Lord Optic, I am ready.")
}

/* COMMANDS */

if(!message.content.startsWith(PREFIX)) return

const args = message.content.slice(PREFIX.length).split(/ +/)
const cmd = args.shift().toLowerCase()

/* HELP */

if(cmd==="help"){

const e = ui("🧠 OPTIC INTELLIGENCE SYSTEM")

.addFields(

{name:"📊 Analytics",
value:"`!serverstats`\n`!topusers`\n`!channelstats`"},

{name:"👤 Utilities",
value:"`!avatar`\n`!userinfo`\n`!serverinfo`\n`!ping`"},

{name:"🧠 Assistant",
value:"`!note add`\n`!note list`\n`!task add`\n`!task list`"},

{name:"🎮 Roblox",
value:"`!rlookup username`"},

{name:"⚙ Permissions",
value:"`!grant`\n`!revoke`\n`!granted`"}

)

message.reply({embeds:[e]})

}

/* PING */

if(cmd==="ping"){
return message.reply(`🏓 ${client.ws.ping}ms`)
}

/* AVATAR */

if(cmd==="avatar"){

const user = message.mentions.users.first()||message.author

const e = ui("Avatar").setImage(
user.displayAvatarURL({size:1024,dynamic:true})
)

message.reply({embeds:[e]})

}

/* USERINFO */

if(cmd==="userinfo"){

const user = message.mentions.users.first()||message.author

const e = ui("User Info")

.addFields(

{name:"Username",value:user.tag,inline:true},
{name:"User ID",value:user.id,inline:true},

{name:"Created",
value:moment(user.createdAt).format("LLLL")}

)

message.reply({embeds:[e]})

}

/* SERVERINFO */

if(cmd==="serverinfo"){

const g = message.guild

const e = ui("Server Info")

.addFields(

{name:"Server",value:g.name},
{name:"Members",value:g.memberCount.toString()},
{name:"Created",value:moment(g.createdAt).format("LLLL")}

)

message.reply({embeds:[e]})

}

/* SERVER STATS */

if(cmd==="serverstats"){

const res = await pool.query(`SELECT COUNT(*) FROM messages`)

const e = ui("Server Analytics")

.addFields(
{name:"Messages Logged",value:res.rows[0].count}
)

message.reply({embeds:[e]})

}

/* TOP USERS */

if(cmd==="topusers"){

const res = await pool.query(`
SELECT username,COUNT(*) as count
FROM messages
GROUP BY username
ORDER BY count DESC
LIMIT 5
`)

const e = ui("Top Active Users")

.setDescription(
res.rows.map(r=>`${r.username} — ${r.count}`).join("\n")
)

message.reply({embeds:[e]})

}

/* NOTES */

if(cmd==="note"){

if(args[0]==="add"){

const text = args.slice(1).join(" ")

await pool.query(
`INSERT INTO notes(text) VALUES($1)`,
[text]
)

message.reply("Note saved.")

}

if(args[0]==="list"){

const res = await pool.query(`SELECT text FROM notes`)

message.reply(res.rows.map(r=>r.text).join("\n")||"No notes")

}

}

/* TASK */

if(cmd==="task"){

if(args[0]==="add"){

const text = args.slice(1).join(" ")

await pool.query(
`INSERT INTO tasks(text) VALUES($1)`,
[text]
)

message.reply("Task added.")

}

if(args[0]==="list"){

const res = await pool.query(`SELECT text FROM tasks`)

message.reply(res.rows.map(r=>r.text).join("\n")||"No tasks")

}

}

/* ROBLOX LOOKUP */

if(cmd==="rlookup"){

if(!args[0]) return message.reply("Provide username")

try{

const r = await fetch(
"https://users.roblox.com/v1/usernames/users",
{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({usernames:[args[0]]})
})

const data = await r.json()

if(!data.data[0]) return message.reply("User not found")

const id = data.data[0].id

const info = await fetch(
`https://users.roblox.com/v1/users/${id}`
).then(r=>r.json())

const avatar = await fetch(
`https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=420x420&format=Png`
).then(r=>r.json())

const e = ui("Roblox Profile")

.setThumbnail(avatar.data[0].imageUrl)

.addFields(

{name:"Username",value:info.name},
{name:"Display",value:info.displayName},
{name:"Created",value:moment(info.created).format("LLLL")}

)

message.reply({embeds:[e]})

}catch{
message.reply("Roblox lookup failed.")
}

}

/* GRANT */

if(cmd==="grant" && message.author.id===OWNER){

const user = message.mentions.users.first()

await pool.query(
`INSERT INTO grants(user_id) VALUES($1) ON CONFLICT DO NOTHING`,
[user.id]
)

message.reply("Access granted.")

}

/* REVOKE */

if(cmd==="revoke" && message.author.id===OWNER){

const user = message.mentions.users.first()

await pool.query(
`DELETE FROM grants WHERE user_id=$1`,
[user.id]
)

message.reply("Access revoked.")

}

})

client.login(process.env.TOKEN)
