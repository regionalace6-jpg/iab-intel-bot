commands.help = async msg => {

    const helpText = `
🟥 INTELLIGENCE PROPERTY COMMANDS

USER INTEL
*userinfo <userID>
*avatar

ROBLOX INTEL
*robloxinfo <username or ID>
*robloxavatar <ID>

OSINT
*iplookup <IP>
*dnslookup <domain>
*domaininfo <domain>

UTILITY
*ping
*iq
*quote
`;

    msg.reply("```" + helpText + "```");
};
