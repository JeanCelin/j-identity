import { Request, Response, NextFunction } from "express";

export function loggerMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
){
  console.log("Nova requisição recebida");
  console.log(request.method);
  console.log(request.url);
  
  //Next diz para o express que o middleware concluíu o trabalho e ele pode continuar a rodar as outras funções, sem ele o app trava.
  next()
}
