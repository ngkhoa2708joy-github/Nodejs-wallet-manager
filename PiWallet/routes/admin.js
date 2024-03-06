var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Transaction = require("../models/transaction");
var mongoose = require("mongoose");
/* GET users listing. */
router.get("/", function (req, res, next) {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  const perUser = 10;
  const page = req.query.page;
  User.find({})
    .skip(perUser * page - perUser)
    .limit(perUser)
    .lean()
    .exec(function (e, userList) {
      User.countDocuments().exec(function (e, count) {
        if (e) {
          console.log(e);
          return res.sendStatus(500);
        } else {
          return res.render("admin/admin", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            userList,
          });
        }
      });
    });
});
router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

//Trang chi tiết account
router.get("/detail/:id", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  User.findOne({ _id: mongoose.Types.ObjectId(req.params.id) }, (e, user) => {
    if (e) {
      console.log(e);
      return res.sendStatus(500);
    }
    if (user) {
      return res.render("admin/accountdetail", {
        detail: user,
        layout: "admin/layout",
      });
    }
  });
});

//trang tài khoản chờ kích hoạt
router.get("/unapproved", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  const perUser = 10;
  const page = req.query.page;

  User.find({ status: ["unapproved", "waiting"] })
    .skip(perUser * page - perUser)
    .limit(perUser)
    .lean()
    .exec(function (e, waiting) {
      User.countDocuments().exec(function (e, count) {
        if (e) {
          console.log(e);
          return res.sendStatus(500);
        } else {
          res.render("admin/waiting", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            waiting,
          });
        }
      });
    });
});

//trang tài khoản đã kích hoạt
router.get("/approved", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  const perUser = 10;
  const page = req.query.page;
  User.find({ status: "approved" })
    .skip(perUser * page - perUser)
    .limit(perUser)
    .lean()
    .exec(function (e, active) {
      User.countDocuments().exec(function (e, count) {
        if (e) {
          console.log(e);
          return res.sendStatus(500);
        } else {
          res.render("admin/active", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            active,
          });
        }
      });
    });
});

//trang tài khoản bị khóa
router.get("/locked", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  const perUser = 10;
  const page = req.query.page;
  User.find({ status: "locked", abnormalLogin: 1 })
    .skip(perUser * page - perUser)
    .limit(perUser)
    .lean()
    .exec(function (e, lock) {
      User.countDocuments().exec(function (e, count) {
        if (e) {
          console.log(e);
          return res.sendStatus(500);
        } else {
          res.render("admin/locked", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            lock,
          });
        }
      });
    });
});

//trang tài khoản bị vô hiệu hóa
router.get("/disabled", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  const perUser = 10;
  const page = req.query.page;
  User.find({ status: "disabled" })
    .skip(perUser * page - perUser)
    .limit(perUser)
    .lean()
    .exec(function (e, disable) {
      User.countDocuments().exec(function (e, count) {
        if (e) {
          console.log(e);
          return res.sendStatus(500);
        } else {
          res.render("admin/disabled", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            disable,
          });
        }
      });
    });
});

//xử lý xác minh tài khoản
router.post("/approve", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  console.log(req.body.userid);
  User.findOne(
    { _id: mongoose.Types.ObjectId(req.body.userid) },
    (e, account) => {
      if (account && !e) {
        User.updateOne(
          { _id: mongoose.Types.ObjectId(req.body.userid) },
          { $set: { status: "approved" } },
          function (e) {
            if (e) {
              console.log(e);
              return res.sendStatus(500);
            } else {
              res.redirect("/");
            }
          }
        );
      } else {
        console.log(e);
        return res.sendStatus(500);
      }
    }
  );
});

//xử lý hủy tài khoản
router.post("/disable", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  console.log(req.body.userid);
  User.findOne(
    { _id: mongoose.Types.ObjectId(req.body.userid) },
    (e, account) => {
      if (account && !e) {
        User.updateOne(
          { _id: mongoose.Types.ObjectId(req.body.userid) },
          { $set: { status: "disabled" } },
          function (e) {
            if (e) {
              console.log(e);
              return res.sendStatus(500);
            } else {
              res.redirect("/");
            }
          }
        );
      } else {
        console.log(e);
        return res.sendStatus(500);
      }
    }
  );
});

//Xử lý gửi yêu cầu bổ sung hồ sơ
router.post("/request", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  console.log(req.body.userid);
  User.findOne(
    { _id: mongoose.Types.ObjectId(req.body.userid) },
    (e, account) => {
      if (account && !e) {
        User.updateOne(
          { _id: mongoose.Types.ObjectId(req.body.userid) },
          { $set: { status: "waiting" } },
          function (e) {
            if (e) {
              console.log(e);
              return res.sendStatus(500);
            } else {
              res.redirect("/");
            }
          }
        );
      } else {
        console.log(e);
        return res.sendStatus(500);
      }
    }
  );
});

//Xử lý mở khóa tài khoản
router.post("/unlock", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  console.log(req.body.userid);
  console.log(req.body.lockedDate);
  User.findOne(
    { _id: mongoose.Types.ObjectId(req.body.userid) },
    (e, account) => {
      if (account && !e) {
        User.updateOne(
          { _id: mongoose.Types.ObjectId(req.body.userid) },
          {
            $set: {
              status: "approved",
              loginFail: 0,
              abnormalLogin: 0,
              lockedAt: "",
            },
          },
          function (e) {
            if (e) {
              console.log(e);
              return res.sendStatus(500);
            } else {
              res.redirect("/");
            }
          }
        );
      } else {
        console.log(e);
        return res.sendStatus(500);
      }
    }
  );
});

//trang lịch sử giao dịch
router.get("/history/:id", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  console.log(req.params.id);
  //người chuyển
  const perUser = 10;
  const page = req.query.page;
  Transaction.find({
    $or: [
      {
        userId: { $elemMatch: { userid: req.params.id } },
      },
      {
        recipient: {
          $elemMatch: { reid: req.params.id },
        },
        status: "success",
      },
    ],
  })
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
          res.render("admin/history", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            transaction,
          });
        }
      });
    });
});

//trang chi tiết giao dịch
router.get("/transdetail/:id", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  console.log(req.params.id);
  Transaction.findOne(
    { _id: mongoose.Types.ObjectId(req.params.id) },
    (e, trans) => {
      if (e) {
        console.log(e);
        return res.sendStatus(500);
      }
      if (trans) {
        console.log({ trans });
        res.render("admin/transactiondetail", {
          detail: trans,
          layout: "admin/layout",
        });
      }
    }
  );
});

//trang giao dịch rút tiền trên 5 triệu
router.get("/withdraw", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  const perUser = 10;
  const page = req.query.page;
  Transaction.find({
    amount: { $gte: 5000000 },
    type: "withdraw",
    status: "pending",
  })
    .sort({ date: -1 })
    .skip(perUser * page - perUser)
    .limit(perUser)
    .lean()
    .exec(function (e, pendlist) {
      Transaction.countDocuments().exec(function (e, count) {
        if (e) {
          console.log(e);
          return res.sendStatus(500);
        } else {
          res.render("admin/transpending", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            pendlist,
          });
        }
      });
    });
});
//trang giao dịch chuyển tiền trên 5 triệu
router.get("/transfer", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  const perUser = 10;
  const page = req.query.page;
  Transaction.find({
    amount: { $gte: 5000000 },
    type: "transfer",
    status: "pending",
  })
    .sort({ date: -1 })
    .skip(perUser * page - perUser)
    .limit(perUser)
    .lean()
    .exec(function (e, pendlist) {
      Transaction.countDocuments().exec(function (e, count) {
        if (e) {
          console.log(e);
          return res.sendStatus(500);
        } else {
          res.render("admin/transpending", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            pendlist,
          });
        }
      });
    });
});

//xử lý đồng ý giao dịch
router.post('/accept', (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  console.log(req.body.transid)
  const amount = parseInt(req.body.amount);
  const fee = parseInt(req.body.fee);
  console.log(req.body.receiver)
  console.log(amount - fee)
  let error = undefined
  let total = amount + fee
  console.log(total)
  Transaction.findOne({ _id: mongoose.Types.ObjectId(req.body.transid) }, (e, trans) => {
    if (trans && !e) {
      if (trans.type == "withdraw") {
        User.findOne({ _id: mongoose.Types.ObjectId(req.body.sender) }, (e, wallet) => {
          console.log({ wallet })
          if (wallet.balance < total) {
            error = 'User has insufficient balance\nPlease decline this transaction!'
            return res.render('admin/transdetail', { error })
            //console.log('User has insufficient balance\nPlease decline this transaction!')
          } else {
            User.updateOne(
              { _id: mongoose.Types.ObjectId(req.body.sender) },
              { $set: { balance: (wallet.balance) - (amount) - (fee) } },
              function (err) {
                if (err) {
                  console.log(err);
                  return res.sendStatus(500)
                } else {
                  Transaction.updateOne(
                    { _id: mongoose.Types.ObjectId(req.body.transid) },
                    { $set: { status: 'success' } },
                    function (e) {
                      if (e) {
                        console.log(e);
                        return res.sendStatus(500)
                      } else {
                        res.redirect('/')
                      }
                    }
                  );
                }
              }
            )
          }
        })
      } else if (trans.type == "transfer") {
        User.findOne({ _id: mongoose.Types.ObjectId(req.body.sender) }, (e, walletSender) => {
          console.log(walletSender)
          if (walletSender.balance < total) {
            error = 'User has insufficient balance\nPlease decline this transaction!'
            return res.render('admin/transdetail', { error })
          } else {
            User.findOne({ phone: req.body.receiver }, (e, walletReceiver) => {
              if (trans.charge_party == "recipient") {
                User.updateOne(
                  { phone: req.body.receiver },
                  { $set: { balance: walletReceiver.balance + (amount - fee) } },
                  function (err) {
                    if (err) {
                      console.log(err);
                      return res.sendStatus(500)
                    } else {
                      User.updateOne(
                        { _id: mongoose.Types.ObjectId(req.body.sender) },
                        { $set: { balance: walletSender.balance - amount } },
                        function (err) {
                          if (err) {
                            console.log(err);
                            return res.sendStatus(500)
                          } else {
                            Transaction.updateOne(
                              { _id: mongoose.Types.ObjectId(req.body.transid) },
                              { $set: { status: 'success' } },
                              function (e) {
                                if (e) {
                                  console.log(e);
                                  return res.sendStatus(500)
                                } else {
                                  res.redirect('/')
                                }
                              }
                            );
                          }
                        }
                      )
                    }
                  }
                )

              } else if (trans.charge_party == "sender") {
                User.updateOne(
                  { phone: req.body.receiver },
                  { $set: { balance: walletReceiver.balance + (amount - (0)) } },
                  function (err) {
                    if (err) {
                      console.log(err);
                      return res.sendStatus(500)
                    } else {
                      User.updateOne(
                        { _id: mongoose.Types.ObjectId(req.body.sender) },
                        { $set: { balance: walletSender.balance - amount - fee } },
                        function (err) {
                          if (err) {
                            console.log(err);
                            return res.sendStatus(500)
                          } else {
                            Transaction.updateOne(
                              { _id: mongoose.Types.ObjectId(req.body.transid) },
                              { $set: { status: 'success' } },
                              function (e) {
                                if (e) {
                                  console.log(e);
                                  return res.sendStatus(500)
                                } else {
                                  res.redirect('/')
                                }
                              }
                            );
                          }
                        }
                      )
                    }
                  }
                )
              }
            })
          }
        })
      }
    } else {
      console.log(e);
      return res.sendStatus(500)
    }
  })
})


//xử lý từ chối giao dịch
router.post("/decline", (req, res, next) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  console.log(req.body.transid);
  Transaction.findOne(
    { _id: mongoose.Types.ObjectId(req.body.transid) },
    (e, trans) => {
      if (trans && !e) {
        Transaction.updateOne(
          { _id: mongoose.Types.ObjectId(req.body.transid) },
          { $set: { status: "fail" } },
          function (e) {
            if (e) {
              console.log(e);
              return res.sendStatus(500);
            } else {
              res.redirect("/");
            }
          }
        );
      } else {
        console.log(e);
        return res.sendStatus(500);
      }
    }
  );
});

//Chức năng tìm kiếm user
router.get("/search", (req, res) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  var email = req.query.email;
  console.log(email);

  const perUser = 10;
  const page = req.query.page;

  User.find({ email: email })
    .skip(perUser * page - perUser)
    .limit(perUser)
    .lean()
    .exec(function (e, userList) {
      User.countDocuments().exec(function (e, count) {
        if (e) {
          console.log(e);
          return res.sendStatus(500);
        } else {
          res.render("admin/admin", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            userList,
          });
        }
      });
    });
});

//Chức năng tìm kiếm user
router.get("/active/search", (req, res) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  var email = req.query.email;
  console.log(email);

  const perUser = 10;
  const page = req.query.page;

  User.find({ email: email, status: "approved" })
    .skip(perUser * page - perUser)
    .limit(perUser)
    .lean()
    .exec(function (e, active) {
      User.countDocuments().exec(function (e, count) {
        if (e) {
          console.log(e);
          return res.sendStatus(500);
        } else {
          res.render("admin/active", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            active,
          });
        }
      });
    });
});
//Chức năng tìm kiếm giao dịch
router.get("/transaction/search", (req, res) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  var from = req.query.from;
  console.log(from);
  var to = req.query.to;
  console.log(to);
  var type = req.query.type;
  console.log(type);

  const perUser = 10;
  const page = req.query.page;

  Transaction.find({
    date: { $gte: from, $lt: to },
    type: type,
    status: "pending",
  })
    .sort({ date: -1 })
    .skip(perUser * page - perUser)
    .limit(perUser)
    .lean()
    .exec(function (e, pendlist) {
      Transaction.countDocuments().exec(function (e, count) {
        if (e) {
          console.log(e);
          return res.sendStatus(500);
        } else {
          //return res.redirect('/admin/withdraw')
          res.render("admin/transpending", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            pendlist,
          });
        }
      });
    });
});

//Chức năng tìm kiếm lịch sử giao dịch
router.get("/history/search", (req, res) => {
  if (typeof req.session.isAdmin == "undefined" || req.session.isAdmin == false)
    res.redirect("/");
  var from = req.query.from;
  console.log(from);
  var to = req.query.to;
  console.log(to);
  var type = req.query.type;
  console.log(type);

  const perUser = 10;
  const page = req.query.page;

  Transaction.find({ $or: [{ date: { $gte: from, $lt: to } }, { type: type }] })
    .sort({ date: -1 })
    .skip(perUser * page - perUser)
    .limit(perUser)
    .lean()
    .exec(function (e, pendlist) {
      Transaction.countDocuments().exec(function (e, count) {
        if (e) {
          console.log(e);
          return res.sendStatus(500);
        } else {
          //return res.redirect('/admin/withdraw')
          res.render("admin/transpending", {
            layout: "admin/layout",
            pagination: {
              page: req.query.page || 1,
              pageCount: Math.ceil(count / perUser),
            },
            pendlist,
          });
        }
      });
    });
});
module.exports = router;
