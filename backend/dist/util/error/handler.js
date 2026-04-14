"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandleUnCaughtException = exports.HandleErrorWithLogger = void 0;
const errors_1 = require("./errors");
// import { logger } from "../logger";
const HandleErrorWithLogger = (error, req, res, next) => {
    let reportError = true;
    let status = 500;
    let data = error.message;
    // skip common / known errors
    [errors_1.NotFoundError, errors_1.ValidationError, errors_1.AuthorizeError].forEach((typeOfError) => {
        if (error instanceof typeOfError) {
            reportError = false;
            status = error.status;
            data = error.message;
        }
    });
    if (reportError) {
        // error reporting tools implementation eg: Cloudwatch,Sentry etc;
        // logger.error(error);
        console.log(error);
    }
    else {
        // logger.warn(error); // ignore common errors caused by user
        console.log(error);
    }
    return res.status(status).json(data);
};
exports.HandleErrorWithLogger = HandleErrorWithLogger;
const HandleUnCaughtException = async (error) => {
    // error report / monitoring tools
    //   logger.error(error);
    console.log(error);
    // recover
    process.exit(1);
};
exports.HandleUnCaughtException = HandleUnCaughtException;
