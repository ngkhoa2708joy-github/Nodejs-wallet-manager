var express = require("express");
var router = express.Router();

const accountModel = require("../models/account");
const userModel = require("../models/users");

const fs = require("fs");
const crypto = require("crypto");
const session = require("express-session");
const multiparty = require("multiparty");
const xoauth2 = require("xoauth2");
const node_mailer = require("nodemailer");
const body_parser = require("body-parser");
const { connect } = require("http2");
const alert = require("alert");
const SMTPTransport = require("nodemailer/lib/smtp-transport");
const User = require("../models/users");
var parseBody = body_parser.urlencoded({ extended: false });

async function sendAccountInfoToMail(email, email_message) {
  let message = {
    from: "TOKO@outlook.com.vn",
    to: email,
    subject: "TOKO Service",
    text: email_message,
  };
  try {
    smtp_transport = node_mailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: "TOKO@outlook.com.vn",
        pass: "Finalweb123",
      },
      tls: {
        requireTLS: true,
        rejectUnauthorized: false,
      },
    });
    await smtp_transport.sendMail(message);
    return "success";
  } catch (err) {
    return err;
  }
}

//Trang landing
router.get("/", function (req, res, next) {
  res.render("index");
});

// Trang đổi mk
router.get("/password", function (req, res, next) {
  if (typeof req.session.username == "undefined") res.redirect("/");
  else res.render("account/password");
});
router.post("/password", parseBody, async function (req, res, next) {
  let body = req.body;
  let username = req.session.username;
  if (typeof username == "undefined") { return res.redirect("/"); }
  else { username = username.toString(); }
  let old_pass = body.old_password.toString();
  let new_pass = body.new_password.toString();
  let verify_new_pass = body.verify_new_password.toString();
  let error = null;

  // Kiểm tra dbase
  if (verify_new_pass != new_pass) {
    error = "The enetered password does not match with the verify password, can you try again";
  }
  if (new_pass.length > 6) {
    error = "The password length is need to larger than 6!";
  }
  if (error) {
    return res.render("account/password", { error });
  }

  
  if (
    (await accountModel.verifyPassword(req.session.username, old_pass)) != null
  ) {
    await accountModel.changePassword(username, new_pass);
    req.session.first_time = false;
    req.session.destroy();
    return res.render("account/login", {success: "Password changed successfully"});
  } else {
    return res.render("account/password", { error: "The old password does not match!" });
  }

});
// Trang khôi phục mật khẩu
router.get("/changepassword", function (req, res, next) {
  res.render("account/changepassword");
});
router.post("/changepassword", parseBody, async function (req, res, next) {
  let body = req.body;
  let phone_number = body.phone_number.toString();
  let email = body.email.toString();
  let error = null;

  res.render("account/otp")

});

// Trang OTP
router.get("/otp", function (req, res, next) {
  res.render("account/otp");
});
router.post("/otp", parseBody, async function (req, res, next) {
  let body = req.body;
  let otp = body.otp.toString();

  let error = null;

  res.render("account/password")

});
//Trang đăng nhập
router.get("/login", (req, res, next) => {
  if (typeof req.session.username == "undefined") {
    res.render("account/login");
  } else {
    res.redirect("/dashboard");
  }
});
router.post("/login", parseBody, async (req, res, next) => {
  let body = req.body;
  let sess = req.session;
  let username = body.username;
  let password = body.password;

  let login_attempts = 0;
  let failedAttempts = await userModel.getLoginFailAttempts(username);
  if (failedAttempts != null) {
    login_attempts = failedAttempts;
  }

  let accountStatus = await userModel.getUserStatus(username);
  if (failedAttempts == 3 || accountStatus == 'locked') {
    res.render("account/login", { error: "The account has been locked due to incorrect password input many times.\nPlease contact the administrator for assistance." });
  } else if (accountStatus == 'disabled') {
    res.render("account/login", { error: "This account has been disabled.\nPlease contact 18001008" });
  }
  else {
    // Kiểm tra username tồn tại
    if ((await accountModel.getUserByUsername(username)) == null) {
      return res.render("account/login", {
        error: "Username or password is incorrect!",
      });
    }

    // Đăng nhập với username
    queryResult = await accountModel.verifyPassword(username, password);
    if (queryResult != null) {
      let userid = await queryResult["user_id"];
      let userModelResult = await userModel.findById(await userid);
      sess.loginFailAttemps = 0;
      sess.username = username;
      sess.isAdmin = await queryResult["isAdmin"];
      if (sess.isAdmin == false) {
        sess.first_time = await queryResult["first_time_login"];
        sess.full_name = await userModelResult["full_name"].toString();
        sess.email = await userModelResult["email"].toString();
        sess.userId = await userModelResult["_id"].toString();
        sess.userstatus = await userModelResult["status"].toString();
      }

      if (
        typeof queryResult["isAdmin"] != "undefined" &&
        sess.isAdmin == true
      ) {
        return res.redirect("/admin");
      }
      // Reset lại số lần đăng nhập thất bại nếu đăng nhập đúng
      await userModel.resetLoginAttempts(username);
      return res.redirect("/dashboard");
    }

    // Đăng nhập thất bại
    if (login_attempts < 4 && username != "admin") {
      await userModel.addLoginFailAttempts(username);
      login_attempts += 1;
      if (login_attempts == 3) {
        await userModel.addAbnormalLoginAndLockAccount(username);
      }
      return res.render("account/login", {
        error: `Password is incorrect, you used ${login_attempts} out of 3 allowed login attempts before the account is locked!`,
      });
    } else {
      return res.render("account/login", {
        error: `Username or password is incorrect!`
      });
    }
  }
});

//Cập nhật cmnd
router.get("/update_id", (req, res, next) => {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  res.render("account/update_id");
});
router.post("/update_id", parseBody, async function (req, res, next) {
  sess = req.session;
  if (typeof sess.username == "undefined") { res.redirect("/"); }
  let form = new multiparty.Form();
  form.parse(req, async (err, fields, files) => {
    let userData = await accountModel.findOne({ username: sess.username });
    if (typeof userData == "undefined") {
      return res.render("account/update_id", { error: "Unknown internal server error" });
    }

    let account_id = userData["account_id"];
    let id_sidea_path = files["id_photo_sidea"][0]["path"];
    let id_sideb_path = files["id_photo_sideb"][0]["path"];

    let id_sidea_file = "sideA" + "_" + account_id + ".png";
    let id_sideb_file = "sideB" + "_" + account_id + ".png";

    let user_id_dir = "./public/test_upload/" + account_id + "/";
    if (!fs.existsSync(user_id_dir)) {
      return res.render("account/update_id", { error: "Internal server error: photo does not exist" });
    }

    fs.copyFile(id_sidea_path, user_id_dir + id_sidea_file, function (err) {
      if (err) throw err;
      console.log(
        `<TOKO Account> User ${account_id} replaced the old upper side ID with file ${id_sidea_file}`
      );
    });
    fs.copyFile(id_sideb_path, user_id_dir + id_sideb_file, function (err) {
      if (err) throw err;
      console.log(
        `<TOKO Account> User ${account_id} replaced the old upper side ID with file ${id_sideb_file}`
      );
      return res.redirect('/dashboard');
    });

  });
});
//Đăng xuất
router.post("/logout", parseBody, async (received, res, next) => {
  received.session.destroy();
  res.redirect("/");
});

//Trang đăng kí
router.get("/register", (req, res, next) => {
  if (typeof req.session.username == "undefined")
    res.render("account/register");
  else res.redirect("/dashboard");
});
router.post("/register", async (req, res, next) => {
  const form = new multiparty.Form();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send(err.message);
    let birthday = fields.birthday.toString();
    let phone = fields.phone.toString();
    let email = fields.email.toString();
    let address = fields.address.toString();
    let full_name = fields.full_name.toString();

    //Sinh file và account_id
    let date = new Date(Date.now());
    let account_id =
      date.getFullYear().toString().slice(2) +
      "U" +
      Math.round(Math.random() * 10000000).toString();

    //Khởi tạo user và lưu hình ảnh
    let obj_user_id = await userModel.createUser(
      full_name,
      email,
      address,
      birthday,
      phone,
      account_id,
      files
    );
    let error = undefined
    if (error) {
      res.render('account/login', { error: error })
    }
    //Khởi tạo account trong db
    if (obj_user_id == null) return;
    let user_info_arr = await accountModel.createAccount(
      account_id,
      phone,
      obj_user_id
    );
    if (user_info_arr == null) return;

    let email_message = `Greeting ${full_name}, \nThank you for registering with Pi, the credentials to access the service is as follows:\nUsername:${user_info_arr[0]}\nPassword:${user_info_arr[1]}`;
    let alert_message = `Account created successfully, however there was a problem with the mail service. Therefore, we deliver this message with your login credential as follows: \nUsername: ${user_info_arr[0]} \nPassword: ${user_info_arr[1]}`;
    //Gửi tài khoản cho user qua email
    
    if (sendAccountInfoToMail(email, email_message) != "success") {
      res.render('account/login', { success: "We send an account to your email.\nPlease check it out" })
    }
  });
});

module.exports = router;
