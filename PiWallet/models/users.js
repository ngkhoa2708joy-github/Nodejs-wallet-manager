const mongoose = require("mongoose");
const alert = require("alert");
const accountModel = require("./account");
const fs = require("fs");
const userSchema = new mongoose.Schema({
  full_name: String,
  email: String,
  address: String,
  dob: Date,
  phone: String,
  loginFail: Number,
  abnormalLogin: Number,
  status: String,
  balance: Number,
  idfront: String,
  idback: String,
});
var User = mongoose.model("User", userSchema);
module.exports = User;

async function saveUserPictureID(account_id, files) {
  // Month runs from 0 to 11. Full year %100 to get the last 2 digits;
  let date = new Date(Date.now());
  let date_string =
    date.getDate() +
    "" +
    (date.getMonth() + 1) +
    "" +
    (date.getFullYear() % 100);

  let id_sidea_path = files["id_photo_sidea"][0]["path"];
  let id_sideb_path = files["id_photo_sideb"][0]["path"];

  let id_sidea_file = "sideA" + "_" + account_id + ".png";
  let id_sideb_file = "sideB" + "_" + account_id + ".png";

  let user_id_dir = "./public/test_upload/" + account_id + "/";

  let test_upload_dir = user_id_dir.split("/");
  let public_test_dir = "./" + test_upload_dir[1] + "/" + test_upload_dir[2];
  if (!fs.existsSync(public_test_dir)) {
    fs.mkdirSync(public_test_dir);
  }
  if (!fs.existsSync(user_id_dir)) {
    fs.mkdirSync(user_id_dir);
  }

  fs.copyFile(id_sidea_path, user_id_dir + id_sidea_file, function (err) {
    if (err) throw err;
    console.log(
      `<TOKO Account> User ${account_id} created account with id sideUpper file ${id_sidea_file}`
    );
  });
  fs.copyFile(id_sideb_path, user_id_dir + id_sideb_file, function (err) {
    if (err) throw err;
    console.log(
      `<TOKO Account> User ${account_id} created account with id sideLower file ${id_sideb_file}`
    );
  });
  return [user_id_dir + id_sidea_file, user_id_dir + id_sideb_file];
}

module.exports.createUser = async function (
  full_name,
  email,
  address,
  dob,
  phone,
  account_id,
  files
) {
  let current_time = new Date(Date.now());
  let isEmailExists = await User.exists({ email: email });
  let isPhoneExists = await User.exists({ phone: phone });
  if (isEmailExists) {
    alert("Email already existed!");
    return null;
    // error = "Email already existed!"
  } else if (isPhoneExists) {
    // error = "Phone already existed!"
    alert("Phone already existed!");
    return null;
  }
  else {
    let id_dir_arr = await saveUserPictureID(account_id, files);
    const oneData = await new User({
      full_name: full_name,
      email: email,
      address: address,
      dob: dob,
      phone: phone,
      loginFail: 0,
      abnormalLogin: 0,
      status: "unapproved",
      balance: 0,
      idfront: id_dir_arr[0]
        .replace(".", "")
        .replace("public", "")
        .substring(1),
      idback: id_dir_arr[1].replace(".", "").replace("public", "").substring(1),
    });
    await oneData.save();
    console.log(`<Pi Web> Created user with phone number ${phone}`);
    return oneData["_id"];
  }
};
async function getObjectUserID(uname) {
  let accountData = await accountModel.getUserByUsername(uname);
  if (
    accountData == null ||
    typeof accountData == "undefined" ||
    accountData["isAdmin"] == true
  )
    return null;
  return (obj_user_id = accountData["user_id"]);
}

module.exports.getLoginFailAttempts = async function (uname) {
  let obj_user_id = await getObjectUserID(uname);
  if (obj_user_id == null || typeof obj_user_id == "undefined") {
    return 0;
  } else {
    let userdata = await User.findById(obj_user_id);
    let attemps = userdata["loginFail"];
    return attemps;
  }
};

module.exports.addLoginFailAttempts = async function (uname) {
  let obj_user_id = await getObjectUserID(uname);
  let attempts = await User.getLoginFailAttempts(uname);
  if (attempts < 4) {
    attempts += 1;
    await User.findByIdAndUpdate(obj_user_id, { loginFail: attempts });
  } else {
    let failedLoginAttempt = (await User.findById({ obj_user_id }))[
      "failedLogin"
    ];
    await User.findByIdAndUpdate(obj_user_id, {
      failedLogin: failedLoginAttempt + 1,
    });
    console.log(
      `<TOKO Web> User ${uname} tried to login with more than 3 wrong attempts`
    );
  }
};

module.exports.getAbnormalLogin = async function (uname) {
  let obj_user_id = await getObjectUserID(uname);
  if (obj_user_id == null || typeof obj_user_id == "undefined") {
    return 0;
  } else {
    let userdata = await User.findById(obj_user_id);
    let attemps = userdata["abnormalLogin"];
    return attemps;
  }
};

module.exports.getUserStatus = async function (uname) {
  let obj_user_id = await getObjectUserID(uname);
  if (obj_user_id == null || typeof obj_user_id == "undefined") {
    return 0;
  } else {
    let userdata = await User.findById(obj_user_id);
    let status = userdata["status"];
    return status;
  }
};
module.exports.addAbnormalLoginAndLockAccount = async function (uname) {
  let obj_user_id = await getObjectUserID(uname);
  let attempts = await User.getAbnormalLogin(uname);
  if (attempts < 4) {
    attempts += 1;
    await User.findByIdAndUpdate(obj_user_id, { abnormalLogin: attempts, status: 'locked', lockedAt: new Date(Date.now()) });
  } else {
    let abnormalLoginAttempts = (await User.findById({ obj_user_id }))[
      "abnormalLogin"
    ];
    await User.findByIdAndUpdate(obj_user_id, {
      abnormalLogin: abnormalLoginAttempts + 1,
    });
    console.log(
      `<TOKO Web> User ${uname} tried to login with more than 3 wrong attempts`
    );
  }
};

module.exports.resetLoginAttempts = async function (uname) {
  let obj_user_id = await getObjectUserID(uname);
  await User.findByIdAndUpdate(obj_user_id, { loginFail: (attempts = 0) });
};
