

const {
  check,
  validationResult,
} = require('express-validator/check')

const { matchedData, sanitize } = require('express-validator/filter')

const {
  OauthMiddleware,
  validationHandlerMiddleware,
} = require('./../middlewares')


module.exports = function (router) {
  // request email verification
  router.get('/send-verification-email', OauthMiddleware, (req, res, next) => {
    const payload = {
      userId: req.userId,
    }

    res.manageServiceResponse(req.broker.call('data.user.send.emailVerification', payload))
  })

  // validate tokens
  router.post('/verificate-email', [
    check('token').exists().trim(),
    validationHandlerMiddleware,
    (req, res) => res.manageServiceResponse(req.broker.call('data.user.verificateEmail', { token: matchedData(req).token })),
  ])
}
