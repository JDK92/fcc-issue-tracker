'use strict';
const { MongoClient, ObjectId } = require("mongodb");

const url    = process.env.MONGO_URI;
const client = new MongoClient(url);
const dbName = "issues";

const dbCollection = async (collectionName) => {
  try {
    await client.connect();
    return client.db(dbName).collection(collectionName);
  } catch (err) {
    throw new Error("Couldn't connect to DB");
  }
}

module.exports =  (app) => {
  app.route('/api/issues/:project')
    .get(async (req, res) => {
      const collection = await dbCollection(req.params.project);
      const documents  = await collection.find(req.query).toArray();

      return res.json(documents);
    })

    .post(async (req, res) => {
      const collection = await dbCollection(req.params.project);
      
      let { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: "required field(s) missing" });
      }

      const newIssue = {
        issue_title,
        issue_text,
        created_by,
        assigned_to: (!assigned_to) ? "" : assigned_to,
        status_text: (!status_text) ? "" : status_text,
        open: true,
        created_on: new Date(),
        updated_on: new Date()
      }

      collection.insertOne(newIssue, (err, doc) => {
        if (err) return res.json({err});
        const { _id } = doc;

        return res.json({ _id, ...newIssue });
      });

    })
    
    .put(async (req, res) => {
      try {
        const collection = await dbCollection(req.params.project);
        const { _id, ...data } = req.body;
        if (!_id) return res.json({ error: "missing _id" });

        console.log(req.body);
        

        if (Object.values(data).length == 0) {
          return res.json({ error: 'no update field(s) sent', _id: _id });
        }

        const changes    = {...data };
        
        const { value } = await collection.findOneAndUpdate({_id: ObjectId(_id)}, { $set: changes });
        
        if (!value) {
          return res.json({ error: "could not update", _id: req.body._id });
        } else {
          await collection.updateOne({_id: ObjectId(_id)}, {
            $set: { updated_on: new Date() }
          });
          return res.json({ result: "successfully updated", _id: _id });
        }

      } catch (err) {
        return res.json({ error: "could not update", _id: req.body._id });
      }
    })

    .delete(async (req, res) => {
      try {
        const collection = await dbCollection(req.params.project);
        const { _id } = req.body;
        if (!_id) return res.json({ error: "missing _id" });

        const { value } = await collection.findOneAndDelete({ _id: ObjectId(_id) });

        if (!value) {
          return res.json({ error: "could not delete", '_id': _id });
        } else {
          return res.json({ result: "successfully deleted", '_id': _id });
        }
      } catch (err) {
        return res.json({ error: "could not delete", '_id': _id });
      }

    });
};