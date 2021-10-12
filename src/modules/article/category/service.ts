import { getCollection } from "../../../lib/dbutils";
import { categoryCollection, categorySchema } from "../category/model";

const selfRealm = 100;

export const getCategories = async (req: any, res: any) => {
  const model = getCollection(
    req.params.realm,
    categoryCollection,
    categorySchema
  );
  let results = await model.find({});
  results = results.map((item: any) => {
    const _item = { ...item._doc };
    _item["id"] = _item["_id"];
    delete _item["_id"];
    return _item;
  });
  res.status(200);
  res.send(results);
  res.end();
};

export const saveCategory = async (req: any, res: any) => {
  const payload = req.body;
  payload["_id"] = payload["id"];
  delete payload["id"];
  const asset = req.params.realm;
  const model = getCollection(asset, categoryCollection, categorySchema);
  if (payload._id) {
    res.status(200);
    res.send(
      await model.findByIdAndUpdate(payload._id, payload, {
        new: true,
      })
    );
    res.end();
  } else {
    const data = new model(payload);
    res.status(200);
    res.send(await data.save());
    res.end();
  }
};
