

const iso3166 = require('iso-3166-1')
const _ = require('lodash')

module.exports = function igBuildProxyURL(ctx, countryIn = 'ES') {
  const countryCode = countryIn.toUpperCase()

  if (!iso3166.whereAlpha2(countryCode)) { throw new Error(`Country not valid, code: ${countryCode}`) }

  const port = 22225
  let username = ''
  let password = ''

  switch (countryCode) {
  case 'ES': {
    username = 'lum-customer-hl_87a87998-zone-zone_spain'
    password = 'h4mago9r6le3'
    break
  }
  default:
    throw new Error(`country not implemented, countryCode:${countryCode}`)
  }

  const urlProxy = `http://${username}-country-${countryCode.toLowerCase()}:${password}@zproxy.luminati.io:${port}`

  // debug
  ctx.broker.logger.debug(`igBuildProxyURL: generated: ${urlProxy}`)

  return urlProxy
}
