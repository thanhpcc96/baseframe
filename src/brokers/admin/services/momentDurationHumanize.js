
/* eslint-d */
const moment = require('moment')
const _ = require('lodash')

moment.relativeTimeThreshold('s', 60)
moment.relativeTimeThreshold('ss', 0) // must be after 's', disables "few seconds"
moment.relativeTimeThreshold('m', 60)
moment.relativeTimeThreshold('h', 24)
moment.relativeTimeThreshold('d', 31)
moment.relativeTimeThreshold('M', 12)

moment.duration.fn.humanizePrecisely = function (options = {}) {
  // Split the duration into parts to be able to filter out unwanted ones
  const allParts = [
    { value: this.years(), unit: 'years' },
    { value: this.months(), unit: 'months' },
    { value: this.days(), unit: 'days' },
    { value: this.hours(), unit: 'hours' },
    { value: this.minutes(), unit: 'minutes' },
    { value: this.seconds(), unit: 'seconds' },
    // cannot format with moment.humanize()
    // { value: duration.milliseconds(), unit: 'milliseconds' },
  ]

  return _(allParts)
    // only use the first parts until the most precise unit wanted
    .take(_.findIndex(allParts, { unit: options.mostPreciseUnit || 'seconds' }) + 1)
    // drop the most significant parts with a value of 0
    .dropWhile(part => part.value === 0)
    // skip other zeroes in the middle (moment.humanize() can't format them)
    .reject(part => part.value === 0)
    // use only the significant parts requested
    .take(options.numberOfSignificantParts || allParts.length)
    // format each part
    .map(part => moment.duration(part.value, part.unit).locale(this.locale()).humanize())
    .join(' ')
}
