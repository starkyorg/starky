import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import next from "next";
import { parse } from "url";

import "reflect-metadata";

import launchIndexers from "./indexer/indexer";
import { cleanStacks } from "./utils/execWithRateLimit";
import config from "./config";
import { setupDb } from "./db";
import { launchBot } from "./discord";
import { getDevHttpsCredentials } from "./utils/devHttps";
import WatchTowerLogger from "./watchTower";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname: config.HOST, port: config.PORT });
const handle = app.getRequestHandler();

const launchServer = async () => {
  // Setup the database
  await setupDb();
  // Prepare the next app
  await app.prepare();
  const httpsCredentials = getDevHttpsCredentials();
  const isHttps = !!httpsCredentials;
  const requestHandler = async (req: any, res: any) => {
    try {
      const parsedUrl = parse(req.url || "", true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      WatchTowerLogger.error("Error occurred handling", { url: req.url, err });
      res.statusCode = 500;
      res.end("internal server error");
    }
  };
  const server = isHttps
    ? createHttpsServer(httpsCredentials, requestHandler)
    : createHttpServer(requestHandler);

  server.listen(config.PORT, async () => {
    WatchTowerLogger.info(
      `> Server ready on http${isHttps ? "s" : ""}://${config.HOST}:${
        config.PORT
      }`
    );
    // Launch the Discord bot
    try {
      await launchBot();
    } catch (e) {
      throw new Error(`[Starky Discord Bot Error] ${e}`);
    }
    // Launch rate limit cleaner
    cleanStacks();
    // Launch the cron
    // Unused for now
    //launchCron();
    // Launch the Indexer
    launchIndexers();
  });
};

launchServer();

export {};
