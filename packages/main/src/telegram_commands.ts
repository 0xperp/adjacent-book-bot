import { TelegramCommand } from "./types";

export default class TelegramCommands {
	// health
	static status: TelegramCommand = async (bot, update, args) =>
		bot.status(update, args);

	// admin
	static authorize: TelegramCommand = async (bot, update) =>
		bot.authorize(update);
	static invite: TelegramCommand = async (bot, update) =>
		bot.invite(update);
	static viewAllOpenBets: TelegramCommand = async (bot, update) =>
		bot.viewAllOpenBets(update);
	static settle: TelegramCommand = async (bot, update, args) =>
		bot.settleBets(update);

	// about
	static commandList: TelegramCommand = async (bot, update) =>
		bot.commandList(update);
	static start: TelegramCommand = async (bot, update) =>
		bot.start(update);

	// betting
	static logBet: TelegramCommand = async (bot, update, args) =>
		bot.logBet(update);
	static viewOpenBets: TelegramCommand = async (bot, update) =>
		bot.viewOpenBets(update);

	// events 
	static getAllEvents: TelegramCommand = async (bot, update) =>
		bot.getOddsForEvent(update);
}