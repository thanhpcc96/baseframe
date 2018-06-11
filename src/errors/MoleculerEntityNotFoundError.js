'use strict';

const { MoleculerError } = require('moleculer').Errors;

module.exports = class EntityNotFoundResponse extends MoleculerError {
  constructor(title, detail = '') {
    super(detail, 404, title, {
      title: title,
      detail: detail,
    });
  }
};
