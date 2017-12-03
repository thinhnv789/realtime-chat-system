const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * User  Mongo DB model
 * @name accountModel
 */
const accountSchema = new mongoose.Schema({
    userName: { type: String, unique: true },
    phoneNumber: { type: String },
    email: { type: String, unique: true },
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    tokens: Array,

    gender: {type: Number}, // 1: male, 2: female, 3: other
    avata: {type: String},
    firstName: {type: String},
    lastName: {type: String},
    address: {type: String},

    roles: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}],
    status: Boolean,
}, {timestamps: true});

/**
 * Password hash middleware.
 */
accountSchema.pre('save', function save(next) {
  const account = this;
  if (!account.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(account.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      account.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating account's password.
 */
accountSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting account's gravatar.
 */
accountSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;