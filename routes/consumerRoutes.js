const express = require('express')
const controllers = require('../controllers/consumer')
const isAuth = require('../util/isAuth')
const { body } = require('express-validator')
const userModel = require('../models/user')

const router = express.Router()

router.get('/products', controllers.getProducts)
router.get('/cart', controllers.getCart)
router.post('/addToCart', isAuth, controllers.addToCart)
router.post('/deleteItem', controllers.deleteFromCart)

router.get('/signup', controllers.getSignup)

router.post('/signup', [
    body('name').isString(),
    body('email').trim().isEmail().withMessage('please enter valid email!').custom((value) => {
        return userModel.find({ email: value })
            .then((user) => {
                if (user.length > 0) {
                    throw new Error('email already exists!')
                }
            })
            .catch((err) => {
                console.log('err in finding email in validation- ', err)
            })
    }),
    body('password').trim().isLength({ min: 3 }).withMessage('pass atleast 3 chars long')
], controllers.postSignup)

router.get('/login', controllers.getLogin)
router.post('/login', controllers.postLogin)

router.get('/signout', controllers.signOut)

router.get('/reset', controllers.getReset)
router.post('/reset', controllers.postReset)
router.get('/reset/:resetToken', controllers.getReset_2)
router.post('/updatePassword', controllers.updatePassword)

router.post('/payment', controllers.payment)
router.post('/saveOrder', controllers.saveOrder)
router.get('/orders', controllers.getOrders)

router.get('/download/:orderId', controllers.download)

module.exports = router