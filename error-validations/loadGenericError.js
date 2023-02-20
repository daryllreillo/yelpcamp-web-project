import { AppError } from './error-class.js';

// error page generic handler function
function loadGenericErrorPage(res, sourceError) {
  const { message = 'Generic Error Message', status = 500, name = 'Z Error' } = sourceError;
  // console.log('%%%%% Error log start %%%%%');
  // console.log(sourceError);
  // console.log('%%%%% Error log end %%%%%');
  const error = new AppError(name, status, message);
  res.status(error.status).render('error.ejs', { pageTitle: `error - ${error.status}`, error });
}

export { loadGenericErrorPage };
