import {
	TelegramCommands,
	Handler,
	TelegramWebhook,
	TelegramBot,
} from "../../main/src/main";
import { Command } from "../../main/src/types";

interface Environment {
	SECRET_TELEGRAM_API_TOKEN: string;
	KV_GET_SET: KVNamespace;
	KV_UID_DATA: KVNamespace;

	AI: string;

	MESSAGES_DB: D1Database;
	USERS_DB: D1Database;
	BOOK_DB: D1Database;

	R2: R2Bucket;
}

export default {
	fetch: async (request: Request, env: Environment) =>
		new Handler([
			{
				bot_name: "@adjacent_book_bot",
				api: TelegramBot,
				webhook: new TelegramWebhook(
					new URL(
						`https://api.telegram.org/bot${env.SECRET_TELEGRAM_API_TOKEN}`
					),
					env.SECRET_TELEGRAM_API_TOKEN,
					new URL(new URL(request.url).origin)
				),
				commands: {
					// default: TelegramCommands.ping as Command,
					// inline: TelegramCommands.dog as Command,

					// betting
					// "/events": TelegramCommands.getAllEvents as Command,
					"/log": TelegramCommands.logBet as Command,
					"/bets": TelegramCommands.viewOpenBets as Command,

					// health
					"/status": TelegramCommands.status as Command,

					// admin 
					"/auth": TelegramCommands.authorize as Command,
					"/invite": TelegramCommands.invite as Command,
					"/allBets": TelegramCommands.viewAllOpenBets as Command,
					"/settle": TelegramCommands.settle as Command,

					// about
					"/commands": TelegramCommands.commandList as Command,
					"/help": TelegramCommands.commandList as Command,
					"/start": TelegramCommands.start as Command,
				},
				kv: { get_set: env.KV_GET_SET, uid_data: env.KV_UID_DATA },
				messages_db: env.MESSAGES_DB,
				user_db: env.USERS_DB,
				book_db: env.BOOK_DB,
				r2: env.R2,
			},
		]).handle(request),
};