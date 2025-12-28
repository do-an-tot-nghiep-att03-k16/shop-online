const crypto = require('crypto')

const code = crypto.randomBytes(64).toString('hex')
console.log(code)
