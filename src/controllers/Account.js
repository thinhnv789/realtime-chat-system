const bluebird = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const passport = require('passport');
const Account = require('../models/Account');
const Role = require('../models/Role');


/**
 * GET /
 * Index page.
 */
exports.getIndex = (req, res) => {
  Account.find({}).populate('roles').exec(function (err, accounts) {
		if (err) {
			console.log('err', err)
			return done(err);
		}
		
		res.render('account/index', {
			title: 'Account List',
			current: ['account', 'index'],
			accounts: accounts
		});
	});
};

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.account) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  req.getValidationResult().then(function(errors) {
    if (!errors.isEmpty()) {
      var errors = errors.mapped();
      res.render('account/login', {
        title: 'Login',
        errors: errors,
        data: req.body
      });
    } else {
      passport.authenticate('local', (err, account, info) => {
        if (err) { return next(err); }
        if (!account) {
          req.flash('errors', info);
          return res.redirect('/login');
        }
        req.logIn(account, (err) => {
          if (err) { return next(err); }
          req.flash('success', { msg: 'Success! You are logged in.' });
          res.redirect(req.session.returnTo || '/');
        });
      })(req, res, next);
    }
  })
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

/**
 * GET /signup
 * Signup page.
 */
exports.getCreate = (req, res) => {
  if (req.account) {
    return res.redirect('/');
  }
  Role.find({}, function(err, roles) {
    res.render('account/create', {
      title: 'Create Account',
      roles: roles
    });
  })
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postCreate = (req, res, next) => {
  req.checkBody('userName', 'UserName is required').notEmpty();
  req.checkBody('email', 'Email is invalid').isEmail();
  req.checkBody('password', 'Password must be at least 4 characters long').len(4);
  req.checkBody('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  req.getValidationResult().then(function(errors) {
    if (!errors.isEmpty()) {
      var errors = errors.mapped();
      console.log('errors', errors);
      Role.find({}, function(err, roles) {
        res.render('account/create', {
          title: 'Create Account',
          roles: roles,
          errors: errors,
          data: req.body
        });
      })
    } else {
      const account = new Account();

      account.firstName = req.body.firstName;
      account.lastName = req.body.lastName;
      account.userName = req.body.userName;
      account.email = req.body.email;
      account.password = req.body.password;
      account.gender = req.body.gender;
      if (req.body.role) {
        account.roles.push(req.body.role);
      }
      account.status = req.body.status;
    
      Account.findOne({ email: req.body.email }, (err, existingAccount) => {
        if (err) { return next(err); }
        if (existingAccount) {
          req.flash('errors', { msg: 'Account with that email address already exists.' });
          return res.redirect('/create');
        }
        account.save((err) => {
          if (err) { return next(err); }
          req.logIn(account, (err) => {
            if (err) {
              return next(err);
            }
            res.redirect('/');
          });
        });
      });
    }
  });
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
  res.render('account/profile', {
    title: 'Account Management'
  });
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  Account.findById(req.account.id, (err, account) => {
    if (err) { return next(err); }
    account.email = req.body.email || '';
    account.profile.name = req.body.name || '';
    account.profile.gender = req.body.gender || '';
    account.profile.location = req.body.location || '';
    account.profile.website = req.body.website || '';
    account.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
          return res.redirect('/account');
        }
        return next(err);
      }
      req.flash('success', { msg: 'Profile information has been updated.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  Account.findById(req.account.id, (err, account) => {
    if (err) { return next(err); }
    account.password = req.body.password;
    account.save((err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  Account.remove({ _id: req.account.id }, (err) => {
    if (err) { return next(err); }
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const provider = req.params.provider;
  Account.findById(req.account.id, (err, account) => {
    if (err) { return next(err); }
    account[provider] = undefined;
    account.tokens = user.tokens.filter(token => token.kind !== provider);
    account.save((err) => {
      if (err) { return next(err); }
      req.flash('info', { msg: `${provider} account has been unlinked.` });
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  Account
    .findOne({ passwordResetToken: req.params.token })
    .where('passwordResetExpires').gt(Date.now())
    .exec((err, account) => {
      if (err) { return next(err); }
      if (!account) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  const resetPassword = () =>
    Account
      .findOne({ passwordResetToken: req.params.token })
      .where('passwordResetExpires').gt(Date.now())
      .then((account) => {
        if (!account) {
          req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
          return res.redirect('back');
        }
        account.password = req.body.password;
        account.passwordResetToken = undefined;
        account.passwordResetExpires = undefined;
        return account.save().then(() => new Promise((resolve, reject) => {
          req.logIn(account, (err) => {
            if (err) { return reject(err); }
            resolve(account);
          });
        }));
      });

  const sendResetPasswordEmail = (account) => {
    return;
  };

  resetPassword()
    .then(sendResetPasswordEmail)
    .then(() => { if (!res.finished) res.redirect('/'); })
    .catch(err => next(err));
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  const createRandomToken = crypto
    .randomBytesAsync(16)
    .then(buf => buf.toString('hex'));

  const setRandomToken = token =>
    Account
      .findOne({ email: req.body.email })
      .then((account) => {
        if (!account) {
          req.flash('errors', { msg: 'Account with that email address does not exist.' });
        } else {
          account.passwordResetToken = token;
          account.passwordResetExpires = Date.now() + 3600000; // 1 hour
          account = account.save();
        }
        return account;
      });

  const sendForgotPasswordEmail = (account) => {
    return;
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendForgotPasswordEmail)
    .then(() => res.redirect('/forgot'))
    .catch(next);
};
