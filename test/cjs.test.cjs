const lib = require("use-fetch-error");

import("./suite.mjs").then(({ runSuite }) => runSuite("cjs", lib));
