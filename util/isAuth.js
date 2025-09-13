function isAuth(req, res, next) {
    if (!req.session.isLoggedIn) {
        console.log('do login first!')
        return res.redirect('/login')
    }
    next()
}

module.exports = isAuth