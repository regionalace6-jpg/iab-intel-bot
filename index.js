const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');

const TOKEN = 'YOUR_BOT_TOKEN';
const CLIENT_ID = 'YOUR_CLIENT_ID';
const GUILD_ID = 'YOUR_GUILD_ID';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

/* ================= REGISTER SLASH COMMAND ================= */

const commands = [
  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Advanced user information panel')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('Select a user')
        .setRequired(false)
    )
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Slash command registered.');
  } catch (err) {
    console.error(err);
  }
})();

/* ================= READY ================= */

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/* ================= BADGE FORMATTER ================= */

function formatBadges(flags) {
  if (!flags || flags.length === 0) return '🔒 Hidden';

  const badgeMap = {
    Staff: '🛠 Discord Staff',
    Partner: '🤝 Partner',
    Hypesquad: '🎉 HypeSquad Events',
    BugHunterLevel1: '🐛 Bug Hunter Lv1',
    BugHunterLevel2: '🐛 Bug Hunter Lv2',
    HypeSquadOnlineHouse1: '🏠 House Bravery',
    HypeSquadOnlineHouse2: '🏠 House Brilliance',
    HypeSquadOnlineHouse3: '🏠 House Balance',
    PremiumEarlySupporter: '💎 Early Supporter',
    VerifiedBot: '🤖 Verified Bot',
    ActiveDeveloper: '👨‍💻 Active Developer'
  };

  return flags.map(flag => badgeMap[flag] || flag).join('\n');
}

/* ================= INTERACTION ================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'userinfo') {
    const user = interaction.options.getUser('target') || interaction.user;

    const member = await interaction.guild.members.fetch(user.id);
    const fullUser = await client.users.fetch(user.id, { force: true });

    const flags = fullUser.flags?.toArray() || [];
    const badges = formatBadges(flags);

    const embed = new EmbedBuilder()
      .setColor(0x111111)
      .setAuthor({
        name: `${user.tag}`,
        iconURL: user.displayAvatarURL({ dynamic: true })
      })
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setImage(fullUser.bannerURL({ dynamic: true, size: 1024 }))
      .addFields(
        {
          name: '🆔 User ID',
          value: user.id,
          inline: true
        },
        {
          name: '🤖 Bot',
          value: user.bot ? 'Yes' : 'No',
          inline: true
        },
        {
          name: '🏆 Highest Role',
          value: member.roles.highest.toString(),
          inline: true
        },
        {
          name: '📊 Role Count',
          value: `${member.roles.cache.size - 1}`,
          inline: true
        },
        {
          name: '🎖 Public Badges',
          value: badges,
          inline: false
        },
        {
          name: '📅 Account Created',
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`,
          inline: false
        },
        {
          name: '📆 Joined Server',
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
          inline: false
        }
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag}`
      })
      .setTimestamp();

    const avatarButton = new ButtonBuilder()
      .setLabel('Download Avatar')
      .setStyle(ButtonStyle.Link)
      .setURL(user.displayAvatarURL({ dynamic: true, size: 2048 }));

    const row = new ActionRowBuilder().addComponents(avatarButton);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
});

client.login(TOKEN);
