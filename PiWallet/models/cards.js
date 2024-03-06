// Model của thẻ (hõ trợ chức năng nạp tiền)
const mongoose = require('mongoose');
const User = require('../models/users');
const Transaction = require('../models/transaction');
const crypto = require('crypto');
/**
* Schema cho thẻ cào.
* CardId = STT
* CardNumber = Số
* expiryDate = Ngày hết hạn
* cvv = Mã CVV
*/
const cardSchema = new mongoose.Schema({
  cardId: Number,
  cardNumber: Number,
  expiryDate: Date,
  cvv: Number,
});

// Tạo collection
var Card = mongoose.model('Card', cardSchema);
module.exports = Card;

// thẻ đầu tiên. Không giới hạn số lần nạp và số tiền mỗi lần nạp.
// Vì chỉ có 3 thẻ nên tạo sẵn như này để vào database luôn. Dễ kiểm tra.
module.exports.cardOne = async function () {
  const cardId = 1;
  const cardNumber = 111111;
  const expiryDate = new Date(2022, 10, 10);
  const cvv = 411;

  // Tạo thành array để xử lý (xem các function ở dưới)
  const cardOneDataArray = [cardId, cardNumber, expiryDate, cvv];

  // Lưu thẻ vào database
  const cardOneData = await new Card({
    cardId: cardId,
    cardNumber: cardNumber,
    expiryDate: expiryDate,
    cvv: cvv,
  });

  await cardOneData.save();
  console.log('Đã tạo thẻ 1');
  return cardOneDataArray;
}

// thể thứ hai. Không giới hạn số lần nạp nhưng chỉ được nạp tối đa 1 triệu/lần.
module.exports.cardTwo = async function () {
  const cardId = 2;
  const cardNumber = 222222;
  const expiryDate = new Date(2022, 11, 11);
  const cvv = 443;

  // Tạo thành array để xử lý (xem các function ở dưới)
  const cardTwoDataArray = [cardId, cardNumber, expiryDate, cvv];

  // Lưu thẻ vào database
  const cardTwoData = await new Card({
    cardId: cardId,
    cardNumber: cardNumber,
    expiryDate: expiryDate,
    cvv: cvv,
  });

  await cardTwoData.save();
  console.log('Đã tạo thẻ 2');
  return cardTwoDataArray;
}

// thẻ thứ 3. Khi nạp bằng thẻ này thì luôn nhận được thông báo là “thẻ hết tiền”.
module.exports.cardThree = async function () {
  const cardId = 3;
  const cardNumber = 333333;
  const expiryDate = new Date(2022, 12, 12);
  const cvv = 577;

  // Tạo thành array để xử lý (xem các function ở dưới)
  const cardThreeDataArray = [cardId, cardNumber, expiryDate, cvv];

  // Lưu thẻ vào database
  const cardThreeData = await new Card({
    cardId: cardId,
    cardNumber: cardNumber,
    expiryDate: expiryDate,
    cvv: cvv,
  });

  await cardThreeData.save();
  console.log('Đã tạo thẻ 3');
  return cardThreeDataArray;
}

/**
 * Chức năng nạp tiền.
 * @param {int} cardNumber Số thẻ cào
 * @param {date} expiryDate Ngày hết hạn
 * @param {int} cvv Mã CVV
 * @param {number} amount Số tiền nạp
 * @param {string} userid userId
 * @param {string} name Tên người dùng
 * @returns {string} Thông báo nạp thành công hoặc lỗi.
 */
module.exports.recharge = async function (cardNumber, expiryDate, cvv, amount, userid, name) {
  // Tạo bằng new Date bị lỗi.
  let cardOneExpiryDate = "2022-10-10";
  let cardTwoExpiryDate = "2022-11-11";
  let cardThreeExpiryDate = "2022-12-12";

  expiryDate.toString();
  if (cardNumber != null && cardNumber.length != 6) return 'Card Number must be 6 digits';
  if (cvv != null && cvv.length != 3) return 'CVV must be 3 digits';

  // Thẻ 1 không giới hạn
  if (cardNumber == 111111) {
    if (expiryDate != cardOneExpiryDate) return 'Invalid date';
    if (cvv != 411) return 'Invalid CVV';

    await User.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(userid) }, { $inc: { balance: amount } });
    await Transaction.create({
      userId: [{ userid, name }],
      date: new Date(Date.now()),
      amount: amount,
      card: cardNumber,
      type: 'recharge',
      status: 'success',
    });
    return 'Success. Please check your balance in your profile';
  }

  // Thẻ 2 nạp tối đa 1 triệu/lần
  if (cardNumber == 222222) {
    if (expiryDate != cardTwoExpiryDate) return 'Invalid date';
    if (cvv != 443) return 'Invalid CVV';
    if (amount > 1000000) return 'Amount must be less than 1 million';

    await User.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(userid) }, { $inc: { balance: amount } });
    await Transaction.create({
      userId: [{ userid, name }],
      date: new Date(Date.now()),
      amount: amount,
      card: cardNumber,
      type: 'recharge',
      status: 'success',
    });
    return 'Success. Please check your balance in your profile';
  }

  // Thẻ 3 luôn hết tiền
  if (cardNumber == 333333) {
    if (expiryDate != cardThreeExpiryDate) return 'Invalid date';
    if (cvv != 577) return 'Invalid CVV';
    return 'This card is out of money';
  }

 
  return 'This card is not supported';
}


/**
 * Chức năng rút tiền
 * @param {int} cardNumber Số thẻ cào
 * @param {date} expiryDate Ngày hết hạn
 * @param {int} cvv Mã CVV
 * @param {number} amount Số tiền rút
 * @param {string} description Ghi chú
 * @param {string} name Tên người dùng
 * @param {string} userid userId
 * @returns {string} Thông báo rút tiền thành công hoặc lỗi.
 */
module.exports.withdraw = async function (cardNumber, expiryDate, cvv, amount, description, userid, name) {
  // Tính năng mô phỏng => chỉ cần rút từ thẻ đầu tiên nên set cứng luôn
  // Tạo ngày bằng new Date bị lỗi
  let defaultExpiryDate = "2022-10-10";

  if (cardNumber == 111111 && expiryDate == defaultExpiryDate && cvv == 411) {
    // Đếm số lần rút tiền của hôm nay. Nếu quá 2 thì không cho rút

    let count = await Transaction.find({ userId: { $elemMatch: { userid: userid } } }).countDocuments({
      // userId sai gì đó nên count = 0
      // userId: [{ user, full_name }]
      date: { $gte: new Date(Date.now() - 86400000) },
      type: 'withdraw',
      status: 'success',
    });
    console.log(count);

    if (count > 2) return 'You have reached the limit of withdrawals today';
    // Nếu chưa đến giới hạn rút tiền thì tiến hành rút tiền
    else {
      if (amount > 5000000) {
        await Transaction.create({
          userId: [{ userid, name }],
          date: new Date(Date.now()),
          fee: amount * 0.05,
          card: cardNumber,
          amount: amount,
          type: 'withdraw',
          note: description,
          status: 'pending',
        });
        return 'Pending request';
      }
      // Không thể bỏ vòng else này vì nó sẽ bị lỗi khi số tiền vừa > 5,000,000 mà còn không chia hết cho 50,000
      else {
        if (amount % 50000 != 0) return 'The amount must be a multiple of 50,000';
        // Ghi nhận vào lịch sử giao dịch

        let balance = (await User.findById({ _id: mongoose.Types.ObjectId(userid) }))[
          "balance"
        ];
        if (balance < amount) {
          return 'Your wallet has insufficient balance';

        } else {
          // 5% phí rút tiền
          await Transaction.create({
            userId: [{ userid, name }],
            date: new Date(Date.now()),
            fee: amount * 0.05,
            card: cardNumber,
            amount: amount,
            type: 'withdraw',
            note: description,
            status: 'success',
          });
          await User.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(userid) }, {
            balance: balance - (amount) - (amount * 0.05),
          });
          return "Success. Please check your balance in your profile"
        }

      }
    }
  } else if (cardNumber == 222222 || cardNumber == 333333) return 'This card is not supported';
  else return 'Invalid card';
}

/**
 * Chức năng chuyển tiền
 * @param {int} phone số điện thoại người nhận
 * @param {string} rename tên người nhận
 * @param {string} name tên người nhận
 * @param {string} party bên chịu phí
 * @param {number} amount Số tiền chuyển
 * @param {string} note Ghi chú
 * @param {string} userid userId
 * @returns {string} Thông báo rút tiền thành công hoặc lỗi.
 */
module.exports.transfer = async function (phone, rename, party, amount, note, userid, name) {

  if (await User.findOne({ phone: phone, full_name: rename, status: "approved" }) == null) {
    return 'Invalid Recipient'
  } else {
    if (amount > 5000000) {
      await Transaction.create({
        userId: [{ userid, name }],
        date: new Date(Date.now()),
        fee: amount * 0.05,
        charge_party: party,
        amount: amount,
        type: 'transfer',
        note: note,
        status: 'pending',
        recipient: [{ phone, rename }]
      });
      return 'Pending request';
    }
    // Không thể bỏ vòng else này vì nó sẽ bị lỗi khi số tiền vừa > 5,000,000 mà còn không chia hết cho 50,000
    else {
      let balanceSender = (await User.findById({ _id: mongoose.Types.ObjectId(userid) }))[
        "balance"
      ];
      let balanceRecipient = (await User.findOne({ phone: phone }))[
        "balance"
      ];
      if (balanceSender < amount) {
        return 'Your wallet has insufficient balance';
      } else {
        if (party == "sender") {
          await Transaction.create({
            userId: [{ userid, name }],
            date: new Date(Date.now()),
            fee: amount * 0.05,
            charge_party: party,
            amount: amount,
            type: 'transfer',
            note: note,
            status: 'success',
            recipient: [{ phone, rename }]
          });
          //nguời gửi
          await User.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(userid) }, {
            balance: balanceSender - amount - (amount * 0.05),
          });
          //người nhận
          await User.findOneAndUpdate({ phone: phone }, {
            balance: balanceRecipient + (amount - (0)),
          });
          return "Success. Please check your balance in your profile !!"
        } else if (party == "recipient") {
          await Transaction.create({
            userId: [{ userid, name }],
            date: new Date(Date.now()),
            fee: amount * 0.05,
            charge_party: party,
            amount: amount,
            type: 'transfer',
            note: note,
            status: 'success',
            recipient: [{ phone, rename }]
          });
          //nguời gửi
          await User.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(userid) }, {
            balance: (balanceSender - amount),
          });
          //người nhận
          await User.findOneAndUpdate({ phone: phone }, {
            balance: balanceRecipient + (amount - (amount * 0.05)),
          });
          return "Success. Please check your balance in your profile !!"
        }
      }
    }
  }

}



/**
 * Mã thẻ cào gồm 10 chữ số. 5 chữ số đầu theo nhà mạng, 5 chữ sau thì random.
 * @param {string} operator Người dùng chọn nhà mạng để tạo thẻ.
 * @return {string} Thẻ cào hoàn chỉnh.
 */
module.exports.generatePhoneCard = async function (operator) {
  let phoneCard = '';
  switch (operator) {
    case 'Viettel':
      phoneCard = '11111' + Math.floor(Math.random() * 100000);
      break;
    case 'Mobifone':
      phoneCard = '22222' + Math.floor(Math.random() * 100000);
      break;
    case 'Vinaphone':
      phoneCard = '33333' + Math.floor(Math.random() * 100000);
      break;
    default:
      return 'Invalid operator';
  }

  return phoneCard;
}

/**
 * Hàm kiểm tra, xử lý thông tin để bán thẻ cào.
 * @param {*} userId Id người dùng.
 * @param {*} operator Người dùng chọn nhà mạng.
 * @param {*} value1 Giá trị của thẻ cào 1.
 * @param {*} value2 Giá trị của thẻ cào 2.
 * @param {*} value3 Giá trị của thẻ cào 3.
 * @param {*} value4 Giá trị của thẻ cào 4.
 * @param {*} value5 Giá trị của thẻ cào 5.
 * @return {String} Hiển thị (các) thẻ cào người dùng đã mua hoặc lỗi.
 */
module.exports.buyPhoneCards = async function (userid, operator, value1, value2, value3, value4, value5, name) {
  // Đừng đặt tên như này. Mình bí tên quá mới đặt vậy thôi.
  let phoneCard1 = '';
  let phoneCard2 = '';
  let phoneCard3 = '';
  let phoneCard4 = '';
  let phoneCard5 = '';
  let transactionId = crypto.randomBytes(16).toString("hex");

  // Tránh trường hợp các giá trị ra thành kiểu float hay kiểu gì khác làm ảnh hưởng đến kết quả.
  value1 = parseInt(value1);
  value2 = parseInt(value2);
  value3 = parseInt(value3);
  value4 = parseInt(value4);
  value5 = parseInt(value5);
  // Tránh sum = NaN.
  let sum = 0;
  sum = value1 + value2 + value3 + value4 + value5;
  sum = parseInt(sum);

  let price1 = value1;
  let price2 = value2;
  let price3 = value3;
  let price4 = value4;
  let price5 = value5;

  // Tạo số thẻ cào người dùng cần mua.
  phoneCard1 = await this.generatePhoneCard(operator);
  if (value2) phoneCard2 = await this.generatePhoneCard(operator);
  if (value3) phoneCard3 = await this.generatePhoneCard(operator);
  if (value4) phoneCard4 = await this.generatePhoneCard(operator);
  if (value5) phoneCard5 = await this.generatePhoneCard(operator);

  let balance = (await User.findById({ _id: mongoose.Types.ObjectId(userid) }))[
    "balance"
  ];
  let userBalance = parseInt(balance);
  if (userBalance < sum) return 'Your wallet does not have enough balance!!';
  else {
    // Ghi nhận vào lịch sử giao dịch.
    await Transaction.create({
      userId: [{ userid, name }],
      date: new Date(Date.now()),
      transactionId: transactionId,
      type: 'phonecard',
      amount: sum,
      status: 'success',
      phonecard: [{ phoneCard1, price1, phoneCard2, price2, phoneCard3, price3, phoneCard4, price4, phoneCard5, price5 }],
      operator: operator,
    });
    await User.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(userid) }, {
      balance: userBalance - sum,
    });

    return 'The card(s) you purcharsed are: ' + phoneCard1 + ' ' + phoneCard2 + ' ' + phoneCard3 + ' ' + phoneCard4 + ' ' + phoneCard5;
  }
}