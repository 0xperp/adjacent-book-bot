# Adjacent Book Bot 

Serverless telegram bot running on Cloudflare Workers

## Setting Webhook

After the bot is deployed you need to set the telegram webhook. You can do so with any of the following

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

`https://https://adjacent-book-bot.adjacentresearch.workers.dev//a948904f2f0f479b8f8197694b30184b0d2ed1c1cd2a1ec0fb85d299a192a447?command=set`

Commands are 
- `set` set the webook
- `get` get information on the webhook
- `delete` delete the webhook
