'use strict';

const { request, response } = require("express");

//  DB STUFF

const mongoose = require("mongoose");

const { model, Schema } = mongoose;
 
const url    = process.env.MONGO_URI;

const Issue = new Schema({
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_by: { type: String, required: true },
  assigned_to: { type: String, default: "" },
  status_text: { type: String, default: "" },
  open: { type: Boolean, default: true },
  created_on: { type: Date, default: new Date() },
  updated_on: { type: Date, default: new Date() },
});


const getCollection = async (collection) => {
  try {
    await mongoose.connect(url);
    return model(collection, Issue, collection);
  } catch (err) {
    throw new Error("Error at db connection");
  }
}

module.exports =  (app) => {
  app.route('/api/issues/:project')
    .get(async (req = request, res = response) => {
      try {
        const collection = await getCollection(req.params.project);
        let documents = await collection.find(req.query);
  
        documents = documents.map(doc => {
          const {__v, ...data} = doc._doc;
          return data;
        });

        console.log(JSON.stringify(documents));
        return res.json(documents);
      } catch (err) {
        return res.json({ error: "couldn't get issues"});
      }
    })

    .post(async (req = request, res = response) => {
      try {
        const Issue = await getCollection(req.params.project);
        const { issue_title, issue_text, created_by, ...optionalFields } = req.body;

        if (!issue_title || !issue_text || !created_by ) {
          return res.json({ error: "required field(s) missing" });
        }

        const newIssue = new Issue({ issue_title, issue_text, created_by, ...optionalFields });
        
        await newIssue.save();
        
        const { __v, ...data } = newIssue._doc;
        
        return res.json(data);
        
      } catch (err) {
        return res.json({ error: "Could not post new issue. Try again." });
      }
    })
    
    .put(async (req = request, res = response) => {
      try {
        const { _id, ...data } = req.body;

        if (!_id) return res.json({ error: "missing _id" });

        if (Object.values(data).length == 0) {
          return res.json({ error: "no update field(s) sent", "_id": _id });
        }

        const collection = await getCollection(req.params.project);
        const document   = await collection.findByIdAndUpdate(
                            req.body._id, {
                            ...data, updated_on: new Date()
                          });

        if (!document) {
          throw "No document found";
        }

        res.json({ result: "successfully updated", "_id": _id });

      } catch (error) {
        return res.json({ error: "could not update", "_id": req.body._id });
      }

      
    })

    .delete(async (req = request, res = response) => {
      try {
        const { _id } = req.body;
        const collection = await getCollection(req.params.project);

        if (!_id) return res.json({ error: "missing _id" });

        const deletedDocument = await collection.findByIdAndDelete(_id);

        if (!deletedDocument) {
          throw "No document found";
        } else {

          return res.json({ result: "successfully deleted", _id });
        }


      } catch (error) {
        return res.json({ error: "could not delete", "_id": req.body._id });
      }
    });
};