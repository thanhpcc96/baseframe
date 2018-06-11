

const _ = require('lodash')

module.exports = (options = { tokenVerifyEmail: '', autoLoginToken: '' }) => {
  const data = {
    link: 'http://app.smartgram.io?',
  }

  if (!_.isEmpty(options.tokenVerifyEmail)) {
    data.link += `cm=${options.tokenVerifyEmail}&`
  }

  if (!_.isEmpty(options.autoLoginToken)) {
    data.link += `al=${options.autoLoginToken}&`
  }

  return data
}
