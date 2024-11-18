const { Client, IntentsBitField } = require("discord.js");
const dotenv = require("dotenv");
const { Keypair, clusterApiUrl, Connection } = require("@solana/web3.js");

dotenv.config();

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMembers,
  ],
});
let keypair = Keypair.generate();
let connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const publicKey = keypair.publicKey.toBase58();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", (message) => {
  console.log(message);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const balance = await connection.getBalance(publicKey);
  console.log("balance:: ", balance);
  if (interaction.commandName === "connect-wallet") {
    const address = interaction.options.getString("wallet_address");
    console.log("address:: ", address);
    await interaction.reply({
      content: `wallet address: ${address}`,
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
