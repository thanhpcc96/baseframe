

const filterAcquisitionMediasAction = require('./filterAcquisitionMediasAction')
const filterAcquisitionAccountsAction = require('./filterAcquisitionAccountsAction')
const filterDisposalAccountsAction = require('./filterDisposalAccountsAction')

module.exports = {
  'acquisition.medias': filterAcquisitionMediasAction,
  'acquisition.accounts': filterAcquisitionAccountsAction,
  'disposal.accounts': filterDisposalAccountsAction,
}

