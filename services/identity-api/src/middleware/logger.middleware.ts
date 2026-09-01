import { Request, Response, NextFunction } from "express";

export function loggerMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
){

  
  //Next diz para o express que o middleware concluíu o trabalho e ele pode continuar a rodar as outras funções, sem ele o app trava.
  next()
}
