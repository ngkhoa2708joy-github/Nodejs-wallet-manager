const mongoose = require("mongoose");
const accountDB = require("../models/account");
const userDB = require("../models/users");
//const cardDB = require('../models/card);
const transactionSchema = new mongoose.Schema({
  userId: [
    {
      userid: String,
      name: String,
    },
  ],
  type: String,
  amount: Number,
  fee: Number,
  date: Date,
  status: String,
  note: String,
  card: String,
  charge_party: String,
  recipient: [
    {
      phone: String,
      rename: String,
    },
  ],
  phonecard: [
    {
      phoneCard1: String,
      price1: Number,
      phoneCard2: String,
      price2: Number,
      phoneCard3: String,
      price3: Number,
      phoneCard4: String,
      price4: Number,
      phoneCard5: String,
      price5: Number,
    }
  ],
  operator: String,
});
var Transaction = mongoose.model("Transaction", transactionSchema); //Tạo collection
module.exports = Transaction;

module.exports.getTransactions = async function (phone) {
  return await Transaction.find({ recipient: [{ phone: phone_number }] });
};

module.exports.transferMoney = async function (
  recipient_phone,
  user_object_id,
  money_amount,
  message,
  type,
  card,
  payment_fee,
  charge_party,
  phone_card,
  phone_operator
) {
  let status = "approved";
  let date = new Date(Date.now());
  if (money_amount > 5000000) status = "pending";
  const oneData = new Transaction({});
};
