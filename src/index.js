import { Client, IntentsBitField } from "discord.js";
import "dotenv/config";
import { Keypair, clusterApiUrl, Connection } from "@solana/web3.js";
import { initializeDatabase } from "./database.js";
import { startPriceTracking } from "./priceTracker.js";
import { handlePriceList, handleSetAlert } from "./command.js";

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMembers,
  ],
});

async function init() {
  initializeDatabase();
  startPriceTracking();

  let keypair = Keypair.generate();
  let connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  const publicKey = keypair.publicKey;

  // client.on("ready", () => {
  //   console.log(`Logged in as ${client.user.tag}!`);
  // });

  // client.on("messageCreate", async (message) => {
  //   if (message.author.bot) return;

  //   if (message.content === "connect-wallet") {
  //     const address = interaction.options.getString("wallet_address");
  //     console.log("address:: ", address);
  //     await interaction.reply({
  //       content: `Wallet Address: ${walletInfo.publicKey}
  //                 Balance: ${balance / 1000000000} SOL (Devnet)`,
  //       ephemeral: true,
  //     });
  //   }
  //   if (message.content === "price-list-and-set-alert") {
  //     const args = message.content.split(" ");
  //     const command = args[0].toLowerCase();

  //     // const option_choices = interaction.options.get("price-options").value;
  //     // if (option_choices === "price-list") {
  //     //   await handlePriceList(interaction);
  //     // } else if (option_choices === "set-alert") {
  //     //   console.log("set-alert interaction", interaction.commandName);
  //     //   await handleSetAlert(message);
  //     // }
  //   }
  // });

  const walletInfo = {
    publicKey: keypair.publicKey.toString(),
    secretKey: Buffer.from(keypair.secretKey).toString("hex"),
  };

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const balance = await connection.getBalance(publicKey);
    if (interaction.commandName === "connect-wallet") {
      const address = interaction.options.getString("wallet_address");
      console.log("address:: ", address);
      await interaction.reply({
        content: `Wallet Address: ${walletInfo.publicKey}
                  Balance: ${balance / 1000000000} SOL (Devnet)`,
        ephemeral: true,
      });
    }

    if (interaction.commandName === "price-list-and-set-alert") {
      const option_choices = interaction.options.get("price-options").value;
      if (option_choices === "price-list") {
        await handlePriceList(interaction);
      }
    }
  });

  client.login(process.env.DISCORD_TOKEN);
}

init();
