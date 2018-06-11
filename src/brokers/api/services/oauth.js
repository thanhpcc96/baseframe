/* eslint-disable */
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const _ = require('lodash');

const config = rootRequire('config');

/**
 * Verify jwt tokens! (API access tokens)
 * @param  {[type]}
 * @param  {Function}
 * @return {[type]}
 */
exports.verify = function(jwtToken) {
  return new Promise((resolve, reject) => {
    const options = {
      ignoreExpiration: false,
      algorithm: 'HS512',
    };

    const secretKey = config.api.secretKey;

    jwt.verify(jwtToken, secretKey, options, (error, decoded) => {
      const responseObject = {
        accessToken: '',
        userId: '',
        expires: -1,
        metadata: null,
      };

      if (
        error &&
        (error.constructor.name === 'TokenExpiredError' ||
          error.constructor.name === 'JsonWebTokenError')
      ) {
        return resolve(responseObject);
      }

      if (error) {
        return reject(error);
      }

      if (decoded) {
        responseObject.accessToken = jwtToken;
        responseObject.userId = decoded.user;
        responseObject.expires = moment.unix(decoded.exp).utc(); // the number of seconds since the Unix Epoch
        responseObject.metadata = decoded;
      }

      resolve(responseObject);
    });
  });
};

/**
 * @param  {[type]}
 * @return {[type]}
 */
exports.grant = function(user) {
  const userId = user && user.id ? user.id : null;
  const refreshToken = user && user.api ? user.api.refreshToken : null;

  if (_.isEmpty(userId)) {
    throw new Error('Not user id found');
  }

  if (_.isEmpty(refreshToken)) {
    throw new Error('Not refreshToken found');
  }

  const payload = {
    user: userId,
    exp: moment()
      .utc()
      .add(config.api.accessTokenTtl, 'seconds')
      .unix(), // the number of seconds since the Unix Epoch
  };

  const secretKey = config.api.secretKey;

  const options = {
    algorithm: 'HS512',
    jwtid: uuidv4(),
  };

  return new Promise((resolve, reject) => {
    jwt.sign(payload, secretKey, options, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          accessToken: token,
          tokenType: 'bearer',
          expiresIn: moment()
            .utc()
            .add(config.api.accessTokenTtl, 'seconds')
            .toISOString(),
          refreshToken,
        });
      }
    });
  });
};
