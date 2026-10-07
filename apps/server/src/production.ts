// the production server runs in production mode, unless NODE_ENV says otherwise,
// this module is imported first, so that it applies before any other module reads NODE_ENV (e.g. React picking its build)
process.env.NODE_ENV ??= 'production'
