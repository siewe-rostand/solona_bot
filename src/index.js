import { Client, IntentsBitField } from "discord.js";
import "dotenv/config";
import { Keypair, clusterApiUrl, Connection } from "@solana/web3.js";
import { initializeDatabase } from "./database.js";
import { startPriceTracking } from "./priceTracker.js";
import { handlePriceList, handleSetAlert } from "./command.js";
import {
  priceList,
  setAlert,
  myAlerts,
  connectWallet,
  walletAddress,
  priceChange,
  optionToken,
  burnHistoryString,
  checkBalanceString,
} from "./constants/command_name.js";
import { handlePriceChangeCommand } from "./priceChange/price_change.js";
import { BurnHistoryTracker } from "./priceChange/burnHistoryTracker.js";
import { WalletBalanceTracker } from "./priceChange/walletBalanceTracker.js";

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
  // startPriceTracking();

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
  const burnTracker = new BurnHistoryTracker();
  const walletBalance = new WalletBalanceTracker();

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const balance = await connection.getBalance(publicKey);

    const { commandName, options } = interaction;

    switch (commandName) {
      case connectWallet:
        await interaction.reply({
          content: `Wallet Address: ${walletInfo.publicKey}
  Balance: ${balance / 1000000000} SOL (Devnet)`,
          ephemeral: true,
        });
        break;
      case priceList:
        await handlePriceList(interaction);
        break;
      case setAlert:
        const token = options.get("token").value;
        const price = options.get("price").value;
        const direction = options.get("direction").value;
        await handleSetAlert(interaction, token, price, direction);

        break;
      case priceChange:
        handlePriceChangeCommand(interaction);
        break;
      case burnHistoryString:
        await burnTracker.handleBurnHistoryCommand(interaction);
        break;
      case checkBalanceString:
        await walletBalance.handleWalletBalanceCommand(interaction);
        break;
      default:
        break;
    }
  });

  client.login(process.env.DISCORD_TOKEN);
}

init();
