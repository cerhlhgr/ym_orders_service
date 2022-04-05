const log4js = require("log4js");
const appRoot = require('app-root-path');
const path = require('path');
const fileName = path.basename(require.main.filename);
const fs = require("fs");

log4js.levels.addLevels({user:{ value: 20000, colour: 'yellow'}})

log4js.configure(
    {
        appenders:
            {
                user: {
                    type: 'file',
                    filename: `${appRoot}/logs/user.log`,
                    encoding: 'utf-8'
                },
                info: {
                    type: 'file',
                    filename: `${appRoot}/logs/info.log`,
                    encoding: 'utf-8'
                },
                fatal: {
                    type: 'file',
                    filename: `${appRoot}/logs/fatal_errors.log`,
                    encoding: 'utf-8'
                },
                warn: {
                    type: 'file',
                    filename: `${appRoot}/logs/warnings.log`,
                    encoding: 'utf-8'
                },
                error: {
                    type: 'file',
                    filename: `${appRoot}/logs/errors.log`,
                    encoding: 'utf-8',
                },
                file: {
                    type: 'file',
                    filename: `${appRoot}/logs/verbose.log`,
                    // maxLogSize: 10 * 1024 * 1024, // = 10Mb
                    // backups: 5, // keep five backup files//compress: true, // compress the backups
                    // encoding: 'utf-8',
                    // mode: 0o0640,
                    // flags: 'w+'
                },
                fileError: {
                    type: 'file',
                    filename: `${appRoot}/logs/errors.log`,
                    maxLogSize: 10 * 1024 * 1024, // = 10Mb
                    backups: 5, // keep five backup files//compress: true, // compress the backups
                    category:"error",
                    encoding: 'utf-8',
                    mode: 0o0640,
                    flags: 'w+'
                },
                console: {
                    type: 'console',
                }


            },
        categories: {
            default: { appenders: ['file','console'], level: 'trace' },
            error: { appenders: ['error','console','file'], level: 'error' },
            warn: { appenders: ['warn','console','file'], level: 'warn' },
            fatal: { appenders: ['fatal','console','file'], level: 'fatal' },
            info:{ appenders: ['info','console','file'], level: 'info'},
            user:{ appenders: ['user','console','file'], level: 'user'}
        }
    }
);

const loggerAll = log4js.getLogger("default");
const loggerFatal = log4js.getLogger("fatal");
const loggerError = log4js.getLogger("error");
const loggerWarn = log4js.getLogger("warn");
const loggerInfo = log4js.getLogger("info");
const loggerUser = log4js.getLogger("user");

class customLogger   //Эксклюзивный логгер от Сереги ну и немного log4js
{
    async error(msg)
    {
        try
        {
            await loggerError.error(msg)
        }
        catch (err)
        {
            return false
        }
    }
    async warn(msg)
    {
        try
        {
            await loggerWarn.warn(msg)
        }
        catch (err)
        {
            return false
        }
    }

    async fatal(msg)
    {
        try
        {
            await loggerFatal.fatal(msg)
        }
        catch (err)
        {
            return false
        }
    }

    async info(msg)
    {
        try
        {
            await loggerInfo.info(msg)
        }
        catch (err)
        {
            return false
        }
    }

    async user(msg)
    {
        try
        {
            await loggerUser.user(msg)
        }
        catch (err)
        {
            return false
        }
    }
}
module.exports = new customLogger()
