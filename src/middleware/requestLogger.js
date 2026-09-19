import morgan from 'morgan';

export const requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms');
