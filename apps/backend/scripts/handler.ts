import {handler} from '../src/lambdas/parseTDI'

(async () => {
  const type=process.env.LAMBDA_ARG
  const e: any = {type: type, filepath:`${type?.toLowerCase()}/${type}.TXT`}
  await handler(e)
})()
