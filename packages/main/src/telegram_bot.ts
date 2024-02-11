import Handler from "./handler";
import {
	preTagString,
	prettyJSON,
	addSearchParams,
	responseToJSON,
} from "./libs";
import TelegramApi from "./telegram_api";
import {
	Joke,
	Bored,
	TelegramInlineQueryResultArticle,
	TelegramInlineQueryResultPhoto,
	TelegramUpdate,
	Config,
	DDGQueryResponse,
	Webhook,
	Commands,
	Kv,
	Bet,
} from "./types";
import { Ai } from "@cloudflare/ai";
import OddsAPI from "./odds_api";

export default class TelegramBot extends TelegramApi {
	url: URL;
	kv: Kv;
	get_set: KVNamespace;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ai: any;
	messages_db: D1Database;
	user_db: D1Database;
	book_db: D1Database;
	r2: R2Bucket;
	bot_name: string;
	notAuthorizedMessage: string;
	admins: number[];
	oddsAPI: OddsAPI;

	constructor(config: Config) {
		super(
			config.commands as Commands,
			config.webhook as Webhook,
			config.handler as Handler
		);
		this.url = config.url;
		this.kv = config.kv as Kv;
		this.get_set = config.kv?.get_set as KVNamespace;
		this.ai = config.ai;
		this.messages_db = config.messages_db;
		this.user_db = config.user_db;
		this.book_db = config.book_db;
		this.r2 = config.r2;
		this.bot_name = config.bot_name;
		this.notAuthorizedMessage = `You are not *authorized* to use this bot. Contact @lucaskohorst if you would like to be invited`;
		this.admins = [779540407]
		this.oddsAPI = new OddsAPI('https://api.the-odds-api.com/v4/', '6239912a59fb467cf75080bd254d98ff');
	}

	// mock function
	// mock = async (update: TelegramUpdate, args: string[]): Promise<any> => {
	// 	// check if authorized first 
	// 	await this.isAuthorized(update.message?.from.id ?? 0).then((results) => {
	// 		if (results) {
	// 			// all logic here
	// 		} else {
	// 			return this.sendMessage(
	// 				update.message?.chat.id ?? 0,
	// 				this.notAuthorizedMessage,
	// 			);
	// 		}
	// 	}).catch((error) => {
	// 		return this.sendMessage(
	// 			update.message?.chat.id ?? 0,
	// 			this.notAuthorizedMessage,
	// 		);
	// 	});
	// };

	// check if a user is authorized
	isAuthorized = async (telegramId: number): Promise<boolean> => {
		const { results } = await this.user_db
			.prepare("SELECT * FROM users WHERE telegramId = ?")
			.bind(telegramId)
			.all();
		if (results.length > 0) {
			return true;
		} else {
			return false;
		}
	};

	// check if a user is admin
	isAdmin = async (telegramId: number): Promise<any> => {
		if (this.admins.length != 0) {
			for (const admin of this.admins) {
				const { results } = await this.user_db
					.prepare("SELECT * FROM Users WHERE telegramId = ?")
					.bind(admin)
					.all();
				if (results.length > 0) {
					return true;
				} else {
					return false;
				}
			}
		} else {
			return false;
		}
	};

	// bot command: /start
	start = async (update: TelegramUpdate): Promise<any> => {
		// check if already in database
		const { results } = await this.user_db
			.prepare("SELECT * FROM users WHERE telegramId = ?")
			.bind(update.message?.from.id)
			.all();
		if (results.length > 0) {
			// check if last_name is not null in the database
			if (results[0].lastName) {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					`Welcome back ${update.message?.from.username} you are already on the book, call /commands to see what you can do`
				);
			} else {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					`You have been invited but not yet onboarded run /auth to get started`
				);
			}
		} else {
			// @TODO this doesn't actually ever run
			return this.sendMessage(
				update.message?.chat.id ?? 0,
				this.notAuthorizedMessage,
				"MarkdownV2"
			);
		}
	}

	// bot command: /auth
	authorize = async (update: TelegramUpdate): Promise<any> => {
		// check if telegramId is authorized 
		const { results } = await this.user_db
			.prepare("SELECT authorized FROM users WHERE telegramId = ?")
			.bind(update.message?.from.id)
			.all();

		if (results && results[0].authorized == 1) {
			// check if last_name is not null
			if (update.message?.from.last_name) {
				// update user values
				const { results } = await this.user_db
					.prepare("UPDATE users SET username = ?, firstName = ?, lastName = ? WHERE telegramId = ?")
					.bind(
						update.message?.from.username,
						update.message?.from.first_name,
						update.message?.from.last_name,
						update.message?.from.id
					)
					.all();
				if (results) {
					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`${update.message?.from.username} updated in the database`
					);
				} else {
					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`${update.message?.from.username} either already in database or could not be added`
					);
				}
			} else {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					`You need to have a last name to be added to the database. Please update your profile and run /auth again`
				);
			}
		} else {
			// user is not authorized reach out to admin to get authorized
			return this.sendMessage(
				update.message?.chat.id ?? 0,
				this.notAuthorizedMessage,
				"MarkdownV2"
			);
		}
	};

	// bot command: /invite <user-id>
	invite = async (update: TelegramUpdate): Promise<any> => {
		// check if authorized first 
		await this.isAdmin(update.message?.from.id ?? 0).then(async (results) => {
			if (results) {
				// message will be /invite <user-id> so we need to parse the user-id
				const userId = Number(update.message?.text?.split(" ")[1]);

				// check if user is already in database
				let { results } = await this.user_db
					.prepare("SELECT * FROM users WHERE telegramId = ?")
					.bind(userId)
					.all();

				if (results.length > 0) {
					// send message to user who invited 
					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`You have already invited user ${userId} let them know run run /auth to get started`,
						"MarkdownV2"
					);
				}

				// add user into user table with telegram id and authorized status 
				await this.user_db
					.prepare("INSERT INTO users (telegramId, authorized) VALUES (?, ?)")
					.bind(userId, 1)
					.all();

				// send message to invited user
				this.sendMessage(
					userId ?? 0,
					`Hi! You've been invited to the Adjacent Book. Run /auth to get started`
				);

				// send message to user who invited 
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					`Invited user ${userId} and added them to the authorized list`,
					"MarkdownV2"
				);
			} else {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					this.notAuthorizedMessage,
					"MarkdownV2"
				);
			}
		}).catch((error) => {
			return this.sendMessage(
				update.message?.chat.id ?? 0,
				this.notAuthorizedMessage,
				"MarkdownV2"
			);
		});
	};

	// bot command: /commandList
	commandList = async (update: TelegramUpdate): Promise<any> => {
		// check if authorized first 
		await this.isAuthorized(update.message?.from.id ?? 0).then((results) => {
			if (results) {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					`${Object.keys(this.commands).join("\n")}`,
					"MarkdownV2"
				);
			} else {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					this.notAuthorizedMessage,
					"MarkdownV2"
				);
			}
		}).catch((error) => {
			return this.sendMessage(
				update.message?.chat.id ?? 0,
				this.notAuthorizedMessage,
				"MarkdownV2"
			);
		});
	};

	// bot command: /status
	status = async (update: TelegramUpdate, args: string[]): Promise<any> => {
		// check if authorized first 
		await this.isAuthorized(update.message?.from.id ?? 0).then((results) => {
			if (results) {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					"Adjacent's Book is _Live_",
					"MarkdownV2"
				);
			} else {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					this.notAuthorizedMessage,
					"MarkdownV2"
				);
			}
		}).catch((error) => {
			return this.sendMessage(
				update.message?.chat.id ?? 0,
				this.notAuthorizedMessage,
				"MarkdownV2"
			);
		});
	};

	getEventsForSport = async (update: TelegramUpdate): Promise<any> => {
		// get sport from message
		const sport = update.message?.text?.split(" ")[1];

		// check if authorized first 
		await this.isAuthorized(update.message?.from.id ?? 0).then(async (results) => {
			if (results) {
				if (sport) {
					// pull all events from the odds api
					await this.oddsAPI.getEvents(sport).then((response) => {
						return this.sendMessage(
							update.message?.chat.id ?? 0,
							`This is the ${JSON.stringify(response)}`
						);
					}).catch(() => {
						return this.sendMessage(
							update.message?.chat.id ?? 0,
							`Error for polling all events`
						);
					});
				} else {
					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`Invalid command format. Please use /events <sport> <event-id>`
					);
				}
			} else {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					this.notAuthorizedMessage,
				);
			}
		}).catch((error) => {
			return this.sendMessage(
				update.message?.chat.id ?? 0,
				this.notAuthorizedMessage,
			);
		});
	};

	getOddsForEvent = async (update: TelegramUpdate): Promise<any> => {
		// message will be /events <sport> <event-id> so we need to parse the sport and event-id
		const sport = update.message?.text?.split(" ")[1];
		const eventId = update.message?.text?.split(" ")[2];
		// check if authorized first 
		await this.isAuthorized(update.message?.from.id ?? 0).then(async (results) => {
			if (results) {
				// check if sport and eventId are not undefined
				if (sport && eventId) {
					// pull all events from the odds api
					await this.oddsAPI.getEventsOdds(sport, eventId).then((response) => {
						return this.sendMessage(
							update.message?.chat.id ?? 0,
							`This is the ${JSON.stringify(response)}`
						);
					}).catch((error) => {
						return this.sendMessage(
							update.message?.chat.id ?? 0,
							`Error for polling all events ${error}\n called with ${sport} and ${eventId}`
						);
					});
				} else {
					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`Invalid command format. Please use /events <sport> <event-id>`
					);
				}
			} else {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					this.notAuthorizedMessage,
				);
			}
		}).catch((error) => {
			return this.sendMessage(
				update.message?.chat.id ?? 0,
				this.notAuthorizedMessage,
			);
		});
	};

	calculatePotentialWinnings = (amount: number, odds: number): number => {
		const decimalOdds = odds >= 0 ? 1 + odds / 100 : 1 - 100 / odds;
		const potentialWinnings = parseFloat((amount * decimalOdds).toFixed(2));
		return potentialWinnings;
	};

	// logBet
	logBet = async (update: TelegramUpdate): Promise<any> => {
		// bets will be logged as /log <bet amount> <odds> <event description>
		const amount = update.message?.text?.split(" ")[1];
		const odds = update.message?.text?.split(" ")[2];
		// description is everything else
		const description = update.message?.text?.split(" ").slice(3).join(" ");

		// check if authorized first 
		await this.isAuthorized(update.message?.from.id ?? 0).then(async (results) => {
			if (results) {
				// take the bet and log it in the database, the columns are amount, odds, eventDescription, toWin, telegramId, datePlaced
				// parse amount and odds into numbers if defined
				if (amount && odds) {
					const parsedAmount = parseInt(amount);
					const parsedOdds = parseInt(odds);
					const randomHexId = Array.from({ length: 5 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '-' + Array.from({ length: 5 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '-' + Array.from({ length: 5 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

					const { results } = await this.book_db
						.prepare("INSERT INTO bets (id, amount, odds, eventDescription, to_win, telegramId, date_placed) VALUES (?, ?, ?, ?, ?, ?, ?)")
						.bind(
							randomHexId,
							amount,
							odds,
							description,
							this.calculatePotentialWinnings(parsedAmount, parsedOdds),
							update.message?.from.id,
							new Date().toISOString().slice(0, 19).replace('T', ' ')
						)
						.all();

					// send message to user who logged the bet
					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`Bet logged for ${update.message?.from.username} for ${amount} at ${odds} odds for ${description}`
					);
				} else {
					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`Invalid command format. Please use /log <bet amount> <odds> <event description>`
					);
				}
			} else {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					"else",
				);
			}
		}).catch((error) => {
			return this.sendMessage(
				update.message?.chat.id ?? 0,
				this.notAuthorizedMessage,
			);
		});
	}

	// format bet 
	formatBet = (bet: Bet): string => {
		return `- ${bet.id}, ${bet.amount} at ${bet.odds} odds for ${bet.eventDescription} with potential winnings of ${bet.to_win}`;
	}

	// view all bets 
	// show value at risk and potential to win
	viewOpenBets = async (update: TelegramUpdate): Promise<any> => {
		// check if authorized first 
		await this.isAuthorized(update.message?.from.id ?? 0).then(async (results) => {
			if (results) {
				// pull all bets from the book
				const { results } = await this.book_db
					.prepare("SELECT * FROM bets WHERE telegramId = ? AND date_settled IS NULL")
					.bind(update.message?.from.id)
					.all();

				if (results.length > 0) {
					// pull bets from the results
					let message = `Bets for ${update.message?.from.first_name}:\n`;
					results.map((bet: any) => {
						// take bet and make it the type Bet
						const formattedBet: Bet = {
							id: bet.id,
							amount: bet.amount,
							odds: bet.odds,
							eventDescription: bet.eventDescription,
							to_win: bet.to_win,
							telegramId: bet.telegramId,
							date_placed: bet.date_placed
						}
						// add the formatted bet to the message
						message += this.formatBet(formattedBet) + "\n";
					});

					// send the message after all bets have been added
					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`${message}`
					);
				} else {
					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`No bets found for ${update.message?.from.username}`
					);
				}
			} else {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					this.notAuthorizedMessage,
				);
			}
		}).catch((error) => {
			return this.sendMessage(
				update.message?.chat.id ?? 0,
				this.notAuthorizedMessage,
			);
		});
	};

	// view all bets if admin 
	// show value at risk and potential to win
	viewAllOpenBets = async (update: TelegramUpdate): Promise<any> => {
		// check if admin first 
		await this.isAdmin(update.message?.from.id ?? 0).then(async (results) => {
			if (results) {
				// pull all bets from the book
				const { results } = await this.book_db
					.prepare("SELECT * FROM bets WHERE date_settled IS NULL")
					.all();

				if (results.length > 0) {
					// pull bets from the results
					let message = `All Bets:\n`;
					const bets = results.map((bet: any) => {
						// take bet and make it the type Bet
						const formattedBet: Bet = {
							id: bet.id,
							amount: bet.amount,
							odds: bet.odds,
							eventDescription: bet.eventDescription,
							to_win: bet.to_win,
							telegramId: bet.telegramId,
							date_placed: bet.date_placed
						}
						// add the formatted bet to the message
						message += this.formatBet(formattedBet) + "\n";
					})

					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`${message}`
					);
				} else {
					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`No bets found`
					);
				}
			} else {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					this.notAuthorizedMessage,
				);
			}
		}).catch((error) => {
			return this.sendMessage(
				update.message?.chat.id ?? 0,
				this.notAuthorizedMessage,
			);
		});
	}

	// settle bets
	settleBets = async (update: TelegramUpdate): Promise<any> => {
		// called like /settle <bet-id> <outcome> 
		// outcome is either won or loss
		const betId = update.message?.text?.split(" ")[1];
		const outcome = update.message?.text?.split(" ")[2];

		// check if admin first 
		// check if admin first 
		await this.isAdmin(update.message?.from.id ?? 0).then(async (results) => {
			if (results) {
				// pull all bets from the book
				let { results: betResults } = await this.book_db
					.prepare("SELECT * FROM bets WHERE id = ?")
					.bind(betId)
					.all();

				if (betResults.length > 0) {
					// update the bet with the outcome
					let settlement = "False"
					let amount = betResults[0].amount

					// check type of amount, if number make it negative if string convert to negative number
					if (typeof amount === 'number') {
						amount = -amount
					} else {
						return this.sendMessage(
							update.message?.chat.id ?? 0,
							`Bet ${betId} could not be settled. This is a database issue. Contact the admin @lucaskohorst`
						);
					}

					if (outcome == "won") {
						settlement = "True"
						// get bet amount if won
						amount = betResults[0].to_win
					}

					let { results: updateResults } = await this.book_db
						.prepare("UPDATE bets SET date_settled = ?, won = ? WHERE id = ?")
						.bind(
							new Date().toISOString().slice(0, 19).replace('T', ' '),
							settlement,
							betId
						).all();

					if (updateResults) {
						// append the bet to the transaction log
						const randomHexId = Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '-' + Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '-' + Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
						const { results: insertResults } = await this.user_db
							.prepare("INSERT INTO transactions (id, betId, telegramId, transaction_date, amount, description) VALUES (?, ?, ?, ?, ?, ?)")
							.bind(
								randomHexId,
								betId,
								update.message?.from.id,
								new Date().toISOString().slice(0, 19).replace('T', ' '),
								amount,
								`${betId} settled as ${outcome} by ${update.message?.from.username}`
							).all();

						return this.sendMessage(
							update.message?.chat.id ?? 0,
							`Bet ${betId} has been settled and appended to the transaction log`
						);
					} else {
						return this.sendMessage(
							update.message?.chat.id ?? 0,
							`Bet ${betId} could not be settled. Use /bet <bet-id> <won/loss> to settle a bet`
						);
					}
				} else {
					return this.sendMessage(
						update.message?.chat.id ?? 0,
						`Bet not found. Use /bet <bet-id> <won/loss> to settle a bet`
					);
				}
			} else {
				return this.sendMessage(
					update.message?.chat.id ?? 0,
					this.notAuthorizedMessage,
				);
			}

		}).catch((error) => {
			return this.sendMessage(
				update.message?.chat.id ?? 0,
				// this.notAuthorizedMessage,
				`${error}`
			);
		});
	}
};