import {getLogger} from "../logging.js";
import path from "path";
import {dataDir, projectDir} from "../index.js";
import {Sequelize} from "sequelize";
import {Umzug, SequelizeStorage} from "umzug";
import {OperatorConfig} from "../infrastructure/OperatorConfig.js";
import {fileOrDirectoryIsWriteable} from "../../utils/io.js";
import {setupMappings} from "./setup.js";
import {Options} from "sequelize/types/sequelize.js";
import {redactString} from "@foxxmd/redact-string";

export const initDB = async (config: OperatorConfig) => {
    const logger = getLogger(config.logging, 'DB');

    const {
        logging: {
            db = false
        } = {},
        database = {
            dialect: 'sqlite'
        },
    } = config;

    let logOption: ((msg: string) => void) | boolean = false;
    if (db !== false) {
        logOption = (msg: string) => logger.debug(msg);
    }

    let seqOpts: Options = database;
    if(seqOpts.dialect === 'sqlite') {
        let dbPath = path.resolve(dataDir, `db.sqlite`);

        logger.debug(`Using SQLITE at ${dbPath}`);
        try {
            fileOrDirectoryIsWriteable(dbPath)
        } catch (e) {
            logger.warn('Unable to access DB file location! Will use MEMORY sqlite database instead. Your database will be wiped when the application is stopped.');
            logger.warn(e);
            dbPath = ':memory:';
        }
        seqOpts.storage = dbPath;
    } else {
        let connectionHint = '';
        if(seqOpts.host !== undefined) {
            connectionHint = redactString(seqOpts.host, 3, {replace: 'numeric'});
        }
        if(seqOpts.port !== undefined) {
            connectionHint = `${connectionHint}:${redactString(seqOpts.port.toString(), 2)}`;
        }
        if(seqOpts.database !== undefined) {
            connectionHint = `${connectionHint}/${seqOpts.database}`
        }
        logger.debug(`Using ${seqOpts.dialect.toUpperCase()} at ${connectionHint}`)
    }

    const sequelize = new Sequelize({
        ...seqOpts,
        logging: logOption
    });

    setupMappings(sequelize);

    await runMigrations(sequelize);

    return sequelize;
}

const logFunc = (payload: Record<string, unknown>) => {
    const parts: string[] = [payload.event as string];
    if(payload.name !== undefined) {
        parts.push(` => ${payload.name}`);
    }
    if(payload.durationSeconds !== undefined) {
        parts.push(` (${payload.durationSeconds}s)`);
    }
    return parts.join('');
}

const runMigrations = async (db: Sequelize): Promise<void> => {

    const logger = getLogger(undefined, 'DB');

    //const logFunc = umzugLoggerFunc(logger);

    const umzug = new Umzug({
        migrations: {
            glob: path.resolve(projectDir, 'src/common/db/migrations/*.js'),
            resolve: ({ name, path, context }) => {
                const migration = require(path)
                return {
                    // adjust the parameters Umzug will
                    // pass to migration methods when called
                    name,
                    up: async () => migration.up(context, Sequelize),
                    down: async () => migration.down(context, Sequelize),
                }
            },
        },
        context: db.getQueryInterface(),
        storage: new SequelizeStorage({sequelize: db}),
        logger: {
            info: (msg) => logger.info(logFunc(msg)),
            warn: (msg) => logger.warn(logFunc(msg)),
            error: (msg) => logger.error(logFunc(msg)),
            debug: (msg) => logger.debug(logFunc(msg)),
        }
    });

    const pending = await umzug.pending();
    if(pending.length === 0) {
        logger.info('No pending migrations!');
    } else {
        logger.info(`${pending.length} pending migrations. Will migrate now.`);
    }

    await umzug.up();
}
