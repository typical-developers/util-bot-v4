import { TypicalClient } from "./lib/extensions/TypicalClient";
import { handleErrors } from "./lib/util/Errors";
import * as dotenv from "dotenv";
dotenv.config();

let client = new TypicalClient();
try
{
    client.login();
    client.logger.info('Successfully logged in to client.');
} catch (err)
{
    client.logger.fatal('Failed to log in to client.');
    client.logger.error(err);
    process.exit(1);
}

let unhandledErrors = ['unhandledRejection', 'uncaughtException', 'uncaughtExceptionMonitor', 'rejectionHandled'];
unhandledErrors.forEach((error) => {
    handleErrors(error);
});
