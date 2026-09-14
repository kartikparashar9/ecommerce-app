const morgan = require("morgan");

const morganConfig =
    process.env.NODE_ENV === "production"
        ? morgan("combined")
        : morgan("dev");

module.exports = morganConfig;