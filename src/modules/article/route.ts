import { authorizeApi } from "../../middlewares";
import { getArticle, listArticles, saveArticle } from "./service";

module.exports = function (router: any) {
  router.put("/:realm/article", authorizeApi, saveArticle);
  router.get("/:realm/article/:id", authorizeApi, getArticle);
  router.post("/:realm/article/search", authorizeApi, listArticles);
};
