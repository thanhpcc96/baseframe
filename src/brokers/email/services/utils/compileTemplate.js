

const fs = require('fs')
const path = require('path')
const util = require('util')

const handlebars = require('handlebars')
const layouts = require('handlebars-layouts')
const mjml2html = require('mjml')
const _ = require('lodash')

const config = rootRequire('config')

/**
 * Main
 */

// load handlebars plugin 'layouts'
handlebars.registerHelper(layouts(handlebars))

// promisify
const lstat = util.promisify(fs.lstat)
const readFile = util.promisify(fs.readFile)
const readdir = util.promisify(fs.readdir)


module.exports = async function compileTemplate(ctx, templateName, variables = {}) {
  const templatesPath = path.normalize(path.join(__base, 'src/brokers/email/services/templates/'))

  await registerAllPartialsPath(path.normalize(path.join(templatesPath, 'partials/includes')))
  await registerAllPartialsPath(path.normalize(path.join(templatesPath, 'partials/layouts')))

  let templatePath = path.normalize(path.join(templatesPath, templateName))

  if (path.extname(templatePath) !== '.mjml') {
    templatePath += '.mjml'
  }

  const templateCompiled = handlebars.compile(await readFile(templatePath, 'utf8'))

  const mjml = templateCompiled(variables)

  const { html, errors } = mjml2html(mjml)

  errors.forEach((error) => {
    ctx.broker.logger.error(error)
  })

  return html
}

/**
 * [registerAllPartialsPath description]
 * @param  {[type]} dirPath [description]
 * @return {[type]}         [description]
 */
async function registerAllPartialsPath(dirPath) {
  if (!(await lstat(dirPath)).isDirectory()) {
    throw new Error('path is not a directory')
  }

  const files = await readdir(dirPath)

  return Promise.all(files.map(fileName => Promise.resolve()
    .then(() => readFile(path.normalize(path.join(dirPath, fileName)), 'utf8'))
    .then(fileData => handlebars.registerPartial(path.parse(fileName).name, fileData))))
}
