import fetch from "node-fetch";
import { EmbedBuilder } from "discord.js";

async function handlePriceChangeCommand(interaction) {
  const tokenAddress = interaction.options.getString("token");

  try {
    // Fetch price data from a Solana price API (e.g., Jupiter Aggregator)
    const priceResponse = await fetch(
      `https://api.jup.ag/price/v2?ids=${tokenAddress},So11111111111111111111111111111111111111112`
    );

    if (!priceResponse.ok) {
      throw new Error(`Failed to fetch price data: ${priceResponse.status}`);
    }
    const jsres = await priceResponse.json();
    const priceData = jsres.data;

    // Create an embed to display price information
    const priceEmbed = new EmbedBuilder()
      .setTitle(`Price Information for ${tokenAddress}`)
      .setColor(0x00ae86)
      .addFields(
        {
          name: "Current Price",
          value: `$${priceData.price}`,
          inline: true,
        },
        {
          name: "24h Change",
          value: `${priceData.priceChange24h}%`,
          inline: true,
        }
      );

    await interaction.reply({ embeds: [priceEmbed] });
  } catch (error) {
    console.error("Price fetch error:", error);
    await interaction.reply("Failed to fetch price information.");
  }
}

export { handlePriceChangeCommand };
