
const jwt = require('jsonwebtoken');
const secret = require('../../config/config').key;

module.exports = verToken = async(ctx, next)=>{
  const token = ctx.headers.authorization;
  if(!token) return;
  verifyToken(token).then((data) =>{
    ctx.state = {
      username : data.data
    }
  });
}
 
verifyToken = async(token) => {
  // return new Promise ((resolve, reject) => {
  //   const userInfo = jwt.verify(token.split(' ')[1], secret);
  //   resolve(userInfo);
  // });
  return data= jwt.decode(token, secret);
}
