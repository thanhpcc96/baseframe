'use strict';

const dns = require('dns');
const _ = require('lodash');

// TODO extract out Node.js module. See http://stackoverflow.com/questions/6048504/synchronous-request-in-nodejs

let domainsWithTags = {
  // Google only has two Gmail domains: https://en.wikipedia.org/wiki/List_of_Google_domains
  'gmail.com': '+',
  'googlemail.com': '+',
  'google.com': '+', // corporate email addresses; TODO presumably country domains also receive corporate email?
  // Microsoft
  'outlook.com': '+',
  'hotmail.com': '+',
  'live.com': '+',
  // Fastmail - https://www.fastmail.com/help/receive/addressing.html TODO: whatever@username.fastmail.com -> username@fastmail.com
  'fastmail.com': '+',
  'fastmail.fm': '+',
  // Yahoo Mail Plus accounts, per https://en.wikipedia.org/wiki/Yahoo!_Mail#Email_domains, use hyphens - http://www.cnet.com/forums/discussions/did-yahoo-break-disposable-email-addresses-mail-plus-395088/
  'yahoo.com.ar': '-',
  'yahoo.com.au': '-',
  'yahoo.at': '-',
  'yahoo.be/fr': '-',
  'yahoo.be/nl': '-',
  'yahoo.com.br': '-',
  'ca.yahoo.com': '-',
  'qc.yahoo.com': '-',
  'yahoo.com.co': '-',
  'yahoo.com.hr': '-',
  'yahoo.cz': '-',
  'yahoo.dk': '-',
  'yahoo.fi': '-',
  'yahoo.fr': '-',
  'yahoo.de': '-',
  'yahoo.gr': '-',
  'yahoo.com.hk': '-',
  'yahoo.hu': '-',
  'yahoo.co.in/yahoo.in': '-',
  'yahoo.co.id': '-',
  'yahoo.ie': '-',
  'yahoo.co.il': '-',
  'yahoo.it': '-',
  'yahoo.co.jp': '-',
  'yahoo.com.my': '-',
  'yahoo.com.mx': '-',
  'yahoo.ae': '-',
  'yahoo.nl': '-',
  'yahoo.co.nz': '-',
  'yahoo.no': '-',
  'yahoo.com.ph': '-',
  'yahoo.pl': '-',
  'yahoo.pt': '-',
  'yahoo.ro': '-',
  'yahoo.ru': '-',
  'yahoo.com.sg': '-',
  'yahoo.co.za': '-',
  'yahoo.es': '-',
  'yahoo.se': '-',
  'yahoo.ch/fr': '-',
  'yahoo.ch/de': '-',
  'yahoo.com.tw': '-',
  'yahoo.co.th': '-',
  'yahoo.com.tr': '-',
  'yahoo.co.uk': '-',
  'yahoo.com': '-',
  'yahoo.com.vn': '-',
};

/**
 * Normalize an email address by removing the dots and address tag.
 */

module.exports = function normalizeEmail(email, options) {

  // TODO destructure when ES6 lands
  options = options || {};
  options.forceRemoveDots = options.forceRemoveDots || true;
  options.forceRemoveTags = options.forceRemoveTags || true;
  //options.detectProvider = options.detectProvider || false;

  email = email.trim().toLowerCase();

  var emailParts = email.split(/@/);
  var user = emailParts[0];
  var domain = emailParts[1];

  if (options.forceRemoveTags) {
    user = user.replace(/[-+=].*/, '');
  } else {
    var separator = domainsWithTags[domain];
    if (separator)
      user = user.split(separator)[0];
  }

  if (options.forceRemoveDots || /^(gmail|googlemail|google)\.com$/.test(domain)) {
    user = user.replace(/\./g, '');
  }

  if (domain === 'googlemail.com') {
    domain = 'gmail.com';
  }

  // detect custom domain email hosting providers TODO providers from https://news.ycombinator.com/item?id=8533588
  var processMXRecords = function processMXRecords(address, user) {
    // presumably, if at least one MX points to a service provider, then the user should expect the provider's special handling when it comes to dots or address tags
    if (/aspmx.*google.*\.com\.?$/i.test(address)) {
      return user.split('+')[0].replace(/\./g, ''); // Google Apps for Work
    }
    // FastMail - https://www.fastmail.com/help/receive/domains.html
    if (/\.messagingengine\.com\.?$/i.test(address)) {
      return user.split('+')[0]; // dots are significant - https://www.fastmail.com/help/account/changeusername.html
    }

    return user;
  };

  var mxLookup = function (domain, timeout, callback) {
    callback = _.once(callback);
    setTimeout(() => callback(), timeout);
    dns.resolveMx(domain, callback);
  };

  return new Promise((resolve, reject) => {
    let timeOut = 3000; //miliseconds

    mxLookup(domain, timeOut, function (err, addresses) {
      if (err && err.code !== 'ENOTFOUND' && err.code !== 'ENODATA' && err.code !== 'ETIMEOUT') {
        reject(err);
      } else {
        if (_.isArray(addresses)) {
          for (var i = 0; i < addresses.length; i++) {
            user = processMXRecords(addresses[i].exchange, user);
          }
        }

        resolve(user + '@' + domain);
      }
    });
  });

};
