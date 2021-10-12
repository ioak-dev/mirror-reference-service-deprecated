import { articleCollection, articleSchema } from "./model";
import * as ArticleTagService from "./tag/service";

import { getCollection } from "../../lib/dbutils";
import { articleTagCollection, articleTagSchema } from "./tag/model";
import { categoryCollection, categorySchema } from "./category/model";

const selfRealm = 100;

export const getArticle = async (req: any, res: any) => {
  const model = getCollection(
    req.params.realm,
    articleCollection,
    articleSchema
  );
  const article = await model.findOne({ _id: req.params.id });
  const tag = await ArticleTagService.getTagsByArticle(
    req.params.realm,
    req.params.id
  );
  const _article = { ...article._doc };
  _article["id"] = article["_id"];
  delete article["_id"];
  res.status(200);
  res.send({ ..._article, tag });
  res.end();
};

export const listArticles = async (req: any, res: any) => {
  const payload = req.body;
  const model = getCollection(
    req.params.realm,
    articleCollection,
    articleSchema
  );
  let results: any[] = [];

  if (payload.text) {
    results = await model
      .find({
        $or: [
          {
            "description.data.text": { $regex: new RegExp(payload.text, "ig") },
          },
          { "title.data.text": { $regex: new RegExp(payload.text, "ig") } },
        ],
      })
      .skip(payload.pageNo * payload.limit)
      .limit(payload.limit);
  } else if (payload.categoryId) {
    results = await model
      .find({ categoryId: payload.categoryId })
      .skip(payload.pageNo * payload.limit)
      .limit(payload.limit);
  } else if (payload.tag) {
    const articleList = await ArticleTagService.getArticlesByTag(
      req.params.realm,
      payload.tag
    );
    results = await model
      .find({ _id: { $in: articleList } })
      .skip(payload.pageNo * payload.limit)
      .limit(payload.limit);
  } else {
    results = await model
      .find()
      .skip(payload.pageNo * payload.limit)
      .limit(payload.limit);
  }
  results = results.map((item) => {
    const _item = { ...item._doc };
    _item["id"] = _item["_id"];
    delete _item["_id"];
    return _item;
  });
  // return {
  //   results: [],
  //   page: 0,
  //   hasMore: false,
  //   total: 0,
  // };
  res.status(200);
  res.send({
    results,
    page:
      results.length === payload.limit ? payload.pageNo + 1 : payload.pageNo,
    hasMore: results.length === payload.limit ? true : false,
  });
  res.end();
};

export const saveArticle = async (req: any, res: any) => {
  const userId = req.userId;
  const payload = req.body;
  payload["_id"] = payload["id"];
  delete payload["id"];
  const asset = req.params.realm;

  const model = getCollection(asset, articleCollection, articleSchema);
  const tagModel = getCollection(asset, articleTagCollection, articleTagSchema);
  let articleResponse: any;

  if (payload._id) {
    const existingArticle = await model.findById(payload._id);
    if (existingArticle.categoryId !== payload.categoryId) {
      const categoryModel = getCollection(
        asset,
        categoryCollection,
        categorySchema
      );
      await categoryModel.findByIdAndUpdate(
        existingArticle.categoryId,
        { $inc: { articles: -1 } },
        { new: true }
      );
      await categoryModel.findByIdAndUpdate(
        payload.categoryId,
        { $inc: { articles: 1 } },
        { new: true }
      );
    }
    articleResponse = await model.findByIdAndUpdate(
      payload._id,
      {
        ...payload,
        updatedBy: userId,
      },
      {
        new: true,
      }
    );
  } else {
    const data = new model({
      ...payload,
      createdBy: userId,
      updatedBy: userId,
    });
    articleResponse = await data.save();
    const categoryModel = getCollection(
      asset,
      categoryCollection,
      categorySchema
    );
    await categoryModel.findByIdAndUpdate(
      payload.categoryId,
      { $inc: { articles: 1 } },
      { new: true }
    );
  }

  payload.addTags.forEach(async (item: any) => {
    const data = new tagModel({
      name: item,
      articleId: articleResponse._id,
    });
    await data.save();
  });

  payload.removeTags.forEach(async (item: any) => {
    await tagModel.deleteMany({
      articleId: articleResponse._id,
      name: item,
    });
  });

  // const categoryStat = await model.aggregate([
  //   {
  //     $group: {
  //       _id: '$categoryId',
  //       count: { $sum: 1 },
  //     },
  //   },
  // ]);

  res.status(200);
  res.send(articleResponse);
  res.end();
};
