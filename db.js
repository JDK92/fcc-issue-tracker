"use strict";

const mongoose = require("mongoose");

const { model, Schema, isValidObjectId } = mongoose;
 
const url    = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(url);
    console.log("Connected to DB");

  } catch (error) {
    throw new Error("Could not connect to DB");
  }
}

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
    return model(collection, Issue, collection);
  } catch (err) {
    throw new Error("Error at db connection");
  }
};



module.exports = {
  isValidObjectId,
  getCollection,
  Issue,
  connectDB
}