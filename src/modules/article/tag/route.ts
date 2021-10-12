import { authorizeApi } from "../../../middlewares";
import { getTags } from "./service";

module.exports = function (router: any) {
  router.get("/:realm/tag", authorizeApi, getTags);
};
