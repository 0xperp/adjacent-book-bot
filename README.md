# Adjacent Book Bot 

Serverless telegram bot on cf workers

## Getting started with cf-workers-telegram-bot

Once you've deployed the bot you can get your Webhook command URL by doing any
of the following.

- sha256sum(YourTelegramSecretKey) is the path to your webhook commands and
  should be put at the end of your worker URL to access commands such as
  setting your webhook
- Use `echo -n yoursecretkey | sha256sum` to get the path
- Open the Cloudflare Worker Logs under **Workers &gt; cf-workers-telegram-bot
  &gt; Logs &gt; Begin log stream** and make a GET request (open it in your browser)
  to your Worker URL and look at the logs to see your Access URL
- Run `wrangler tail --format pretty` from inside your git repository and make
  a GET request to your Worker URL

Example URL for setting the Webhook and dropping pending updates:

`https://cf-workers-telegram-bot.codebam.workers.dev/a948904f2f0f479b8f8197694b30184b0d2ed1c1cd2a1ec0fb85d299a192a447?command=set`
