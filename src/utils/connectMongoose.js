

const mongoose = require('mongoose')

module.exports = function connectMongoose(databaseUri) {
  mongoose.Promise = global.Promise
  return mongoose.connect(databaseUri, {
    // useMongoClient: true,
    keepAlive: 120,
  }).then(
    () => {},
    (err) => {
      console.log(err)
      // force exit!
      process.exit(-1)
    },
  )
}
