module.exports = {
  "extends": "airbnb-base",

  "globals": {
    "rootRequire": true,
    "__base": true
  },

  "env": {
      "es6": true,
      "node": true
  },

  "parserOptions": {
    "ecmaVersion": 2017
  },

  "rules": {
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "never"
    ],
    "max-len": [
      2, {
        "code": 200, 
        "tabWidth": 2, 
        "ignoreUrls": true
      }
    ],
    "no-use-before-define": ["error", { "functions": false }],
    "no-param-reassign": 0,
    "prefer-destructuring": 0,
    "no-underscore-dangle": ["error", { "allow": ["_id", "__v"] }],
    "no-await-in-loop": 0,
    "global-require": 0
  }

}