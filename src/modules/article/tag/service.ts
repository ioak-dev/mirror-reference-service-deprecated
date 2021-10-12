import { articleTagCollection, articleTagSchema } from "./model";

import { getCollection } from "../../../lib/dbutils";

const selfRealm = 100;

export const getTagsByArticles = async (
  realm: any,
  articleIdList: string[]
) => {
  const model = getCollection(realm, articleTagCollection, articleTagSchema);
  const tags = await model.find({ articleId: { $in: articleIdList } });
  const articleTagMap: any = {};
  tags.forEach((item: any) => {
    if (articleTagMap[item.articleId]) {
      articleTagMap[item.articleId].push(item.name);
    } else {
      articleTagMap[item.articleId] = [item.name];
    }
  });

  return articleTagMap;
};

export const getTagsByArticle = async (realm: any, articleId: string) => {
  const model = getCollection(realm, articleTagCollection, articleTagSchema);
  const tags = await model.find({ articleId });
  const articleTagList: string[] = [];
  tags.forEach((item: any) => {
    articleTagList.push(item.name);
  });

  return articleTagList;
};

export const getArticlesByTag = async (realm: any, tag: string) => {
  const model = getCollection(realm, articleTagCollection, articleTagSchema);
  const tags = await model.find({
    name: { $regex: new RegExp(tag, "ig") },
  });
  console.log(tags);
  const articleList: string[] = [];
  tags.forEach((item: any) => {
    articleList.push(item.articleId);
  });

  return articleList;
};

export const getTags = async (req: any, res: any) => {
  const model = getCollection(
    req.params.realm,
    articleTagCollection,
    articleTagSchema
  );
  const tags = await model.distinct("name", {});

  res.status(200);
  res.send(tags);
  res.end();
};
