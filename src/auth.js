const passport = require('koa-passport');

passport.serializeUser((user, done) => {
  done(null, user.username)
});

passport.deserializeUser((username, done) => {
  UserModel.findById(username, (err, user) => {
    done(err, user);
  })
});

// const LocalStrategy = require('passport-local');
// passport.use(new LocalStrategy(
//   async (username, password, done) => {
//     const user = await UserModel.findOne({ username });
//     if (!user) return done(null, false);
//     if (!user.verifyPassword(password)) return done(null, false);
//     return done(null, user);
//   }
// ));