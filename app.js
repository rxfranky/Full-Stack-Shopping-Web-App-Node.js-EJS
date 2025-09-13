const express = require('express')
const mongoose = require('mongoose')
const adminRoutes = require('./routes/admin')
const consumerRoutes = require('./routes/consumerRoutes')
const bodyParser = require('body-parser')
const multer = require('multer')
const session = require('express-session')
const mongodbStore = require('connect-mongodb-session')(session)

const app = express()

const store = new mongodbStore({
    uri: 'mongoDBUri',
    collection: 'session'
})

app.use(session({
    secret: 'sessionsecret',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}))

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
        cb(null, true)
    }
    else {
        cb(null, false)
    }

}

app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))

app.use(express.static('images'))
app.use(express.static('invoices'))

app.set('view engine', 'ejs')
app.set('views', 'views')

app.use(bodyParser.urlencoded({ extended: false }))

app.use('/admin', adminRoutes)
app.use(consumerRoutes)

app.use('/', (req, res) => {
    let email = null;

    if (req.session.isLoggedIn) {
        email = req.session.user.email
    }
    res.render('homePage', {
        title: 'homepage',
        isAuthenticated: req.session.isLoggedIn,
        email: email
    })
})

mongoose.connect('mongodbUri')

app.listen(3000)