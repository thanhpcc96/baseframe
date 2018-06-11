

const { MoleculerConflictDataError, MoleculerRequiredActionUserError } = rootRequire('./src/errors')

// const Client = require('instagram-private-api').V1
const Client = require('./../client')

module.exports = async function igApiErrorHandler(error) {
  console.error('--------------------------------------------------->>>>>')
  console.error('igApiErrorHandler -> ')
  console.error(typeof error)
  console.error('--->')
  console.error(error)
  console.error('--->')
  console.error(error.constructor.name)
  console.error('---------------------------------------------------<<<<')

  console.error('igApiErrorHandler -> unhandled response')
  console.error(err)
  return Promise.reject(err)
}
