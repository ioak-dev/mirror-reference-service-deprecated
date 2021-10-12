const express = require("express");
const router = express.Router();

router.get("/", (_: any, res: any) => {
  res.send("v1.0.0");
  res.end();
});

require("./modules/hello/route")(router);
require("./modules/article/route")(router);
require("./modules/article/tag/route")(router);
require("./modules/article/category/route")(router);

module.exports = router;
