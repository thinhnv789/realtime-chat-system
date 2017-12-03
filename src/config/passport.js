const passport = require('passport');
const request = require('request');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const Account = require('../models/Account');

passport.serializeUser((account, done) => {
  done(null, account.id);
});

passport.deserializeUser((id, done) => {
  Account.findById(id, (err, account) => {
    done(err, account);
  });
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  Account.findOne({ email: email.toLowerCase() }, (err, account) => {
    if (err) { 
      console.log('find err', err);
      return done(err); 
    }
    if (!account) {
      console.log('account not found');
      return done(null, false, { msg: `Email ${email} not found.` });
    }
    account.comparePassword(password, (err, isMatch) => {
      if (err) { 
        console.log('error compare pass');
        return done(err); 
      }
      if (isMatch) {
        console.log('success');
        return done(null, account);
      }
      console.log('Invalid email or pass');
      return done(null, false, { msg: 'Invalid email or password.' });
    });
  });
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy({
  clientID: '754220301289665',
  clientSecret: '41860e58c256a3d7ad8267d3c1939a4a',
  callbackURL: '/auth/facebook/callback',
  profileFields: ['name', 'email', 'link', 'locale', 'timezone', 'gender'],
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.account) {
    Account.findOne({ facebook: profile.id }, (err, existingAccount) => {
      if (err) { return done(err); }
      if (existingAccount) {
        req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        Account.findById(req.account.id, (err, account) => {
          if (err) { return done(err); }
          account.facebook = profile.id;
          account.tokens.push({ kind: 'facebook', accessToken });
          account.profile.name = account.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
          account.profile.gender = account.profile.gender || profile._json.gender;
          account.profile.picture = account.profile.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`;
          account.save((err) => {
            req.flash('info', { msg: 'Facebook account has been linked.' });
            done(err, account);
          });
        });
      }
    });
  } else {
    Account.findOne({ facebook: profile.id }, (err, existingAccount) => {
      if (err) { return done(err); }
      if (existingAccount) {
        return done(null, existingAccount);
      }
      Account.findOne({ email: profile._json.email }, (err, existingEmailAccount) => {
        if (err) { return done(err); }
        if (existingEmailAccount) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.' });
          done(err);
        } else {
          const account = new Account();
          account.email = profile._json.email;
          account.facebook = profile.id;
          account.tokens.push({ kind: 'facebook', accessToken });
          account.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
          account.profile.gender = profile._json.gender;
          account.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
          account.profile.location = (profile._json.location) ? profile._json.location.name : '';
          account.save((err) => {
            done(err, account);
          });
        }
      });
    });
  }
}));

/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy({
  clientID: '828110519058.apps.googleusercontent.com',
  clientSecret: 'JdZsIaWhUFIchmC1a_IZzOHb',
  callbackURL: '/auth/google/callback',
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.account) {
    Account.findOne({ google: profile.id }, (err, existingAccount) => {
      if (err) { return done(err); }
      if (existingAccount) {
        req.flash('errors', { msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        Account.findById(req.account.id, (err, account) => {
          if (err) { return done(err); }
          account.google = profile.id;
          account.tokens.push({ kind: 'google', accessToken });
          account.profile.name = account.profile.name || profile.displayName;
          account.profile.gender = account.profile.gender || profile._json.gender;
          account.profile.picture = account.profile.picture || profile._json.image.url;
          account.save((err) => {
            req.flash('info', { msg: 'Google account has been linked.' });
            done(err, account);
          });
        });
      }
    });
  } else {
    Account.findOne({ google: profile.id }, (err, existingAccount) => {
      if (err) { return done(err); }
      if (existingAccount) {
        return done(null, existingAccount);
      }
      Account.findOne({ email: profile.emails[0].value }, (err, existingEmailAccount) => {
        if (err) { return done(err); }
        if (existingEmailAccount) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.' });
          done(err);
        } else {
          const account = new Account();
          account.email = profile.emails[0].value;
          account.google = profile.id;
          account.tokens.push({ kind: 'google', accessToken });
          account.profile.name = profile.displayName;
          account.profile.gender = profile._json.gender;
          account.profile.picture = profile._json.image.url;
          account.save((err) => {
            done(err, account);
          });
        }
      });
    });
  }
}));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
   return res.redirect('/account/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split('/').slice(-1)[0];
  const token = req.account.tokens.find(token => token.kind === provider);
  if (token) {
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};
