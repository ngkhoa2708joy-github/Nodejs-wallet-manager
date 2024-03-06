var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Transaction = require("../models/transaction.js");
const mongoose = require("mongoose")
var express = require("express");
var router = express.Router();
var cardModel = require("../models/cards");
const bodyparser = require("body-parser");
const parseBody = bodyparser.urlencoded({ extended: false });

/* Trang home page. */
router.get("/", async function (req, res, next) {
  sess = req.session;
  if (typeof sess.username != "undefined") {
    if (sess.first_time == true) {
      res.render("account/password", { error: "Please change your password before using the system!" })
    } else {
      let userstatus = await User.getUserStatus(req.session.username);
      if (userstatus == "waiting") userstatus = "updateID";
      console.log(userstatus);
      res.render("user/welcome", {
        layout: 'user/dashboard',
        full_name: req.session.full_name,
        email: req.session.email,
        accountStatus: (userstatus == "updateID") ? "updateID" : null,
      });
    }
  } else {
    res.redirect("/");
  }
});
router.post("/", (req, res, next) => { });

//Trang lịch sử giao dịch
router.get("/history", (req, res, next) => {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  console.log(req.session.userId)


  User.findOne({ _id: mongoose.Types.ObjectId(req.session.userId) }, (e, user) => {
    if (user.status == "unapproved" || user.status == "waiting") {
      res.render("user/history", {
        layout: "user/dashboard",
        full_name: req.session.full_name,
        email: req.session.email,
        error: "This feature is only for verified accounts."
      });
    } else {
      const perTran = 10;
      const page = req.query.page;
      Transaction.find(
        {
          $or: [
            {
              userId: { $elemMatch: { userid: req.session.userId } },
            },
            {
              recipient: {
                $elemMatch: { reid: req.session.userId },
              },
              status: "success",
            },
          ],
        }

      )
        .sort({ date: -1 })
        .skip(perTran * page - perTran)
        .limit(perTran)
        .lean()
        .exec(function (e, transaction) {
          Transaction.countDocuments().exec(function (e, count) {
            if (e) {
              console.log(e);
              return res.sendStatus(500);
            } else {
              res.render("user/history", {
                layout: "user/dashboard", full_name: req.session.full_name,
                email: req.session.email,
                userstatus: user.status,
                pagination: {
                  page: req.query.page || 1,
                  pageCount: Math.ceil(count / perTran),
                },
                transaction,
              });
            }
          });
        });
    }
  })
});
//Trang chi tiết giao dịch
router.get('/detail/:id', (req, res, next) => {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  Transaction.findOne({
    _id: mongoose.Types.ObjectId(req.params.id)
  }, (e, trans) => {
    if (e) {
      console.log(e);
      return res.sendStatus(500);
    } else {
      res.render("user/transdetail", {
        detail: trans,
        full_name: req.session.full_name,
        username: req.session.username,
        email: req.session.email, layout: "user/dashboard"
      })
    }
  })
})
//Trang thông tin User
router.get("/profile", (req, res, next) => {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  console.log(req.session.email)
  User.findOne({ email: req.session.email }, (e, user) => {
    if (e) {
      console.log(e);
      return res.sendStatus(500)
    }
    if (user) {
      return res.render("user/profile", {
        profile: user, full_name: req.session.full_name, username: req.session.username,
        email: req.session.email, layout: "user/dashboard"
      })
    }
  })
})

//Xử lý tìm kiếm lịch sử giao dịch
router.get("/history/search", (req, res) => {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  var from = req.query.from;
  console.log(from);
  var to = req.query.to;
  console.log(to);
  var type = req.query.type;
  console.log(type);
  User.findOne({ _id: mongoose.Types.ObjectId(req.session.userId) }, (e, user) => {
    const perUser = 10;
    const page = req.query.page;

    Transaction.find({ $or: [{ date: { $gte: from, $lt: to } }, { type: type }] })
      .sort({ date: -1 })
      .skip(perUser * page - perUser)
      .limit(perUser)
      .lean()
      .exec(function (e, transaction) {
        Transaction.countDocuments().exec(function (e, count) {
          if (e) {
            console.log(e);
            return res.sendStatus(500);
          } else {
            res.render("user/history", {
              full_name: req.session.full_name,
              email: req.session.email,
              layout: "user/dashboard",
              userstatus: user.status,
              pagination: {
                page: req.query.page || 1,
                pageCount: Math.ceil(count / perUser),
              },
              transaction,
            });
          }
        });
      });
  })
});

// Nạp tiền vào tài khoản
router.get("/recharge", function (req, res) {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  User.findOne({ _id: mongoose.Types.ObjectId(req.session.userId) }, (e, user) => {
    if (user.status == "unapproved" || user.status == "waiting") {
      res.render("user/recharge", {
        layout: "user/dashboard",
        full_name: req.session.full_name,
        email: req.session.email,
        error: "This feature is only for verified accounts."
      });
    } else {
      res.render("user/recharge", {
        layout: "user/dashboard", userstatus: user.status, full_name: req.session.full_name, username: req.session.username,
        email: req.session.email
      });
    }
  })

});

router.post("/recharge", parseBody, async function (req, res) {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  let body = req.body;
  let userid = req.session.userId;
  let name = req.session.full_name;
  let cardNumber = body.cardNumber;
  let expiryDate = body.expiryDate;
  let cvv = body.cvv;
  let amount = body.amount;
  let result = await cardModel.recharge(cardNumber, expiryDate, cvv, amount, userid, name);
  res.render("user/recharge", {
    full_name: req.session.full_name, username: req.session.username,
    email: req.session.email, userstatus: req.session.userstatus,
    layout: "user/dashboard", result: result
  });
});

// Rút tiền từ tài khoản
router.get("/withdraw", function (req, res) {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  User.findOne({ _id: mongoose.Types.ObjectId(req.session.userId) }, (e, user) => {
    if (user.status == "unapproved" || user.status == "waiting") {
      res.render("user/withdraw", {
        layout: "user/dashboard",
        full_name: req.session.full_name,
        email: req.session.email,
        error: "This feature is only for verified accounts."
      });
    } else {
      res.render("user/withdraw", {
        layout: "user/dashboard", full_name: req.session.full_name, username: req.session.username,
        email: req.session.email, userstatus: user.status
      });
    }
  })

});

router.post("/withdraw", async function (req, res) {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  let body = req.body;
  let userid = req.session.userId;
  let name = req.session.full_name;
  let cardNumber = body.cardNumber;
  let expiryDate = body.expiryDate;
  let cvv = body.cvv;
  let amount = body.amount;
  let description = body.description;
  console.log({ userid, name })
  let result = await cardModel.withdraw(cardNumber, expiryDate, cvv, amount, description, userid, name);
  res.render("user/withdraw", {
    full_name: req.session.full_name, username: req.session.username,
    email: req.session.email, userstatus: req.session.userstatus,
    layout: "user/dashboard", result: result
  });
});

// Chuyển khoản
router.get("/transfer", function (req, res) {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  User.findOne({ _id: mongoose.Types.ObjectId(req.session.userId) }, (e, user) => {
    if (user.status == "unapproved" || user.status == "waiting") {
      res.render("user/transfer", {
        layout: "user/dashboard",
        full_name: req.session.full_name,
        email: req.session.email,
        error: "This feature is only for verified accounts."
      });
    } else {
      res.render("user/transfer", {
        layout: "user/dashboard", full_name: req.session.full_name, userstatus: user.status, username: req.session.username,
        email: req.session.email
      });
    }
  })

});

router.post("/transfer", async function (req, res) {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  let body = req.body;
  let userid = req.session.userId;
  let name = req.session.full_name;
  let rename = body.name;
  let phone = body.phoneNumber;
  let party = body.party;
  let amount = body.amount;
  let note = body.note;
  let result = await cardModel.transfer(phone, rename, party, amount, note, userid, name);
  res.render("user/transfer", {
    full_name: req.session.full_name, username: req.session.username,
    email: req.session.email, userstatus: req.session.userstatus,
    layout: "user/dashboard", result: result
  });
});

//Mua thẻ điện thoại
router.get("/phonecard", function (req, res) {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  User.findOne({ _id: mongoose.Types.ObjectId(req.session.userId) }, (e, user) => {
    if (user.status == "unapproved" || user.status == "waiting") {
      res.render("user/phonecard", {
        layout: "user/dashboard",
        full_name: req.session.full_name,
        email: req.session.email,
        error: "This feature is only for verified accounts."
      });
    } else {
      res.render("user/phonecard", {
        layout: "user/dashboard", full_name: req.session.full_name, userstatus: user.status, username: req.session.username,
        email: req.session.email
      });
    }
  })

});

router.post("/phonecard", async function (req, res) {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  let body = req.body;
  let userid = req.session.userId;
  let serviceProvider = body.serviceProvider;
  let name = req.session.full_name;
  let phoneCard1 = body.value1;
  let phoneCard2 = body.value2;
  let phoneCard3 = body.value3;
  let phoneCard4 = body.value4;
  let phoneCard5 = body.value5;
  let result = await cardModel.buyPhoneCards(userid, serviceProvider, phoneCard1, phoneCard2, phoneCard3, phoneCard4, phoneCard5, name);
  res.render("user/phonecard", {
    full_name: req.session.full_name, username: req.session.username,
    email: req.session.email, userstatus: req.session.userstatus,
    layout: "user/dashboard", result: result
  });
});

module.exports = router;
