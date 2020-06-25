const key = require('../../../config/config').key;
const md5 = require('blueimp-md5');
const query = require('../../mysqlConnect/mysqlconnect')
const mysqlconfig = require('../../../config/config.js');
const jsonwebtoken = require('jsonwebtoken');
const verToken = require('../../middlewares/passport');
let config = require('../../../config/config');
const fs = require("fs");
const { stringify } = require('querystring');
const util = require('util')



class UserController {
  // 用户注册
  async register(ctx) {
    let rows = await query('select * from user where userGroup = 0')
    if(rows[0]) return ctx.error({msg:'已存在管理员，无法再次创建'});
    const {username, password} = ctx.request.body
    const pw_encrypt = md5(password, key)
    const query_context = "(userGroup, username, password)\
      VALUES\
      (0, \'admin\', \'"+ pw_encrypt+"\')\
      "; 
    query("INSERT INTO "+ mysqlconfig.table_name_user + " " + query_context);
    config.admin = username
    delete require.cache[require.resolve("../../../config/config")]
    config = require("../../../config/config")
    ctx.success({ 
      msg: '注册成功!',
      data: {'username':"username"}
    });
  }

  // 用户登录 
  async login(ctx) {
    let { userGroup, username, password } = ctx.request.body;
    if (userGroup == 0) {
      if(username != config.admin) return ctx.error({msg:"管理员用户名错误"})
      username = 'admin';
    }
    // console.log(1);

    let user = await query(`select * from user where username = '${username}' and userGroup = '${userGroup}'`)
    if (!user[0]) {
      return ctx.error({ msg: '该用户尚未注册或用户群错误' });
    }
    if(md5(password, key) != user[0].password){
      return ctx.error({ msg: '密码错误' });
    }

    console.log("用户"+user[0].username+"登陆成功");


    let account = parseInt(config.loginAccount)
    account++;
    config.loginAccount = account + ''

    fs.writeFileSync('config/config.js', 'module.exports = '+JSON.stringify(config,null,'\t'), function (err) {
      if (err) {
        return console.error(err);
      }
    })
    
    delete require.cache[require.resolve("../../../config/config")]
    config = require("../../../config/config")


    ctx.success({ msg: '登录成功', data: {
      username: user[0].username,
      token: jsonwebtoken.sign({
        data: user[0].username,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7 * 10), //  = 10 weeks
      }, key)
    }});
  }

  //添加普通用户和只读用户
  async addUser(ctx){
    await verToken(ctx);
    const username_login = ctx.state.username;
    if(username_login != 'admin'){
      return ctx.error({msg:"非管理员用户无权添加新用户"})
    }

    let {userGroup,username,password} = ctx.request.body
    userGroup = parseInt(userGroup)
    if(userGroup!= 1 && userGroup!=2) return ctx.error({msg:"无法创建该用户组账户"})

    let hasone = await query(`select * from user where username = '${username}'`)
    if(hasone[0]) return ctx.error({msg:"用户名已存在"})

    const pw_encrypt = md5(password, key)
    const query_context = `(userGroup, username, password)\
      VALUES\
      (${userGroup}, '${username}', '${pw_encrypt}')\
      `; 
    await query("INSERT INTO "+ mysqlconfig.table_name_user + " " + query_context);
    
    
    ctx.success({ 
      msg: '注册成功!' ,
      data: {'username':username}
    });

  }

  //查看用户信息
  async getUserInfo(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    delete user[0].password
    return ctx.success({data:user[0]})
  }

  //查看登录次数
  async getloginAccount(ctx){
    return ctx.success({data:parseInt(config.loginAccount)})
  }

  //登录次数清零
  async resetloginAccount(ctx){
    config.loginAccount = '0'
    fs.writeFileSync('config/config.js', 'module.exports = '+JSON.stringify(config,null,'\t'), function (err) {
      if (err) {
        return console.error(err);
      }
    })
    
    delete require.cache[require.resolve("../../../config/config")]
    config = require("../../../config/config")
    return ctx.success({data:parseInt(config.loginAccount)})
  }
  //删除管理员
  async deleteadmin(ctx){
    config.loginAccount = '0'

  
    
    let rows = await query(`
    delete from user where username = 'admin';
    `)

    return ctx.success({})
  }

}



module.exports = new UserController();