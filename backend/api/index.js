// Vercel serverless entry — every request is rewritten here (see vercel.json).
// `vercel-build` compiles the Nest app to dist/ before functions are bundled.
module.exports = require('../dist/serverless').default;
