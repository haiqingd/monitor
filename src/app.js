const Koa = require('koa');
const app = new Koa();

// require('../mysqlConnect/showDatabaseStatus')

// require('./collection/schedule')

// require('../prometheus/connect')
// cors
var cors = require('koa2-cors');
app.use(cors());

app.use(require('./middlewares/response.js'));
app.use(require('./middlewares/filter.js'));

// body parser
const bodyParser = require('koa-bodyparser')();
app.use(bodyParser);

// const koaBody = require('koa-body');
// app.use(koaBody());


// app.use(koaBody({
//   multipart: true,
//   strict: false,//设为false
//   formidable: {
//     maxFileSize: 200 * 1024 * 1024
//   }
// }))

//router
const router = require('./routes/index');
app.use(router.routes());

// passport
const jwt = require('koa-jwt');
const verToken = require('./middlewares/passport');
app.use(verToken);

//koa-jwt
try {
  const errorHandle = require('./middlewares/jwtHandle');
  app.use(errorHandle);
} catch (e) {
  ctx.error({ msg: 'jwt 错误' });
}
const key = require('../config/config.js').key;
app.use(jwt({ key, })
  .unless({ path: [/\/register/, /\/user/], })
)




const port = require('../config/config');
app.listen(port.serverport);
console.log('app listened at http://localhost' + ':' + port.serverport);
