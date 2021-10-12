import { authorizeApi } from "../../../middlewares";
import { getCategories, saveCategory } from "./service";

module.exports = function (router: any) {
  router.get("/:realm/category", authorizeApi, getCategories);
  router.put("/:realm/category", authorizeApi, saveCategory);
};
