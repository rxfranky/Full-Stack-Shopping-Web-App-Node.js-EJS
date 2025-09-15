const productModel = require('../models/products')
const cartModel = require('../models/cart')
const userModal = require('../models/user')
const bcrypt = require('bcrypt')
const { validationResult } = require('express-validator')
const sgMail = require('@sendgrid/mail')
const crypto = require('crypto')
const Razorpay = require('razorpay')
const orderModel = require('../models/orders')
const pdfDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')
const { Downloader } = require('nodejs-file-downloader')
const dotenv=require('dotenv')
dotenv.config({path: '.env.local'})


var instance = new Razorpay({
    key_id: process.env.Rpay_key_id,
    key_secret: process.env.Rpay_key_secret,
});

sgMail.setApiKey(process.env.SG_API_KEY)

exports.getProducts = (req, res, next) => {
    productModel.find()
        .then((products) => {
            let email = null;
            if (req.session.isLoggedIn) {
                email = req.session.user.email
            }
            res.render('products', {
                products: products,
                title: 'products page',
                isAuthenticated: req.session.isLoggedIn,
                email: email
            })
        })
        .catch((err) => {
            console.log('err during fetch prods- ', err)
        })
}

exports.getCart = (req, res) => {
    cartModel.find()
        .then((items) => {
            let email = null;
            if (req.session.isLoggedIn) {
                email = req.session.user.email
            }
            res.render('cart', {
                title: 'cart page',
                items: items,
                isAuthenticated: req.session.isLoggedIn,
                email: email
            })
        })
        .catch((err) => {
            console.log("err in fetching prods for cart- ", err)
        })
}

exports.addToCart = (req, res) => {
    const id = req.body.id
    productModel.findById(id)
        .then((product) => {
            cartModel.find({ title: product.title, price: product.price, desc: product.desc, imageUrl: product.imageUrl })
                .then((item) => {
                    if (item.length > 0) {
                        const cartItem = new cartModel({
                            title: item[0].title,
                            price: item[0].price,
                            desc: item[0].desc,
                            imageUrl: item[0].imageUrl,
                            quantity: item[0].quantity + 1
                        })
                        cartItem.save()
                            .then((quanIncitem) => {
                                cartModel.findByIdAndDelete(item[0]._id)
                                    .then((prevItem) => { console.log('quan incresed and prev item deleted- ', prevItem) })
                                    .catch((err) => {
                                        console.log('err in prev item deletation', err)
                                    })
                                res.redirect('/cart')
                            })
                            .catch((err) => {
                                console.log("err in saving quantity inc item- ", err)
                            })
                    }
                    else {
                        const cartItem = new cartModel({
                            title: product.title,
                            price: product.price,
                            desc: product.desc,
                            imageUrl: product.imageUrl,
                            quantity: 1
                        })
                        cartItem.save()
                            .then((addedCartItem) => {
                                res.redirect('/cart')
                            })
                            .catch((err) => {
                                console.log("err in saving cart item- ", err)
                            })
                    }
                })
                .catch((err) => {
                    console.log("err in find in cart model- ", err)
                })
        })
        .catch((err) => {
            console.log("cant find product- ", err)
        })
}

exports.deleteFromCart = (req, res, next) => {
    const id = req.body.id

    cartModel.findById(id)
        .then((item) => {
            if (item.quantity > 1) {
                const cartItem = new cartModel({
                    title: item.title,
                    price: item.price,
                    desc: item.desc,
                    imageUrl: item.imageUrl,
                    quantity: item.quantity - 1
                })
                cartItem.save()
                    .then(() => {
                        cartModel.findByIdAndDelete(item._id)
                            .then((prevItem) => { console.log('deleted prev quan item- ', prevItem) })
                            .catch((err) => { console.log('err in del prev quan item- ', err) })
                        res.redirect('/cart')
                    })
                    .catch((err) => { console.log('err in saving red quan item- ', err) })
            }
            else {
                cartModel.findByIdAndDelete(item._id)
                    .then((deletedItem) => { console.log('quantity 1 item deleted', deletedItem) })
                    .catch((err) => { console.log('err in deleting quantity 1 item- ', err) })
                res.redirect('/cart')
            }
        })
        .catch((err) => { console.log('err in finding item in cart- ', err) })
}

exports.getSignup = (req, res, next) => {
    let email = null;
    if (req.session.isLoggedIn) {
        email = req.session.user.email
    }
    res.render('signup', { title: 'signup page', isAuthenticated: req.session.isLoggedIn, email: email })
}

exports.postSignup = (req, res) => {
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password

    const hassedPass = bcrypt.hashSync(password, 10)

    const valiResult = validationResult(req)
    if (!valiResult.isEmpty()) {
        valiResult.errors.map((errObj) => { return console.log('validation failed and msg is- ', errObj.msg) })
        return res.redirect('/signup')
    }

    userModal.find({ email: email })
        .then((val) => {
            if (val.length > 0) {
                console.log('this email is already exists!')
                return res.redirect('/signup')
            }
            else {
                const user = new userModal({
                    name: name,
                    email: email,
                    password: hassedPass
                })
                user.save()
                    .then((savedUser) => {
                        console.log('saved user- ', savedUser)
                        const msg = {
                            from: 'sahidafridi0076@gmail.com',
                            to: savedUser.email,
                            subject: 'Signup successful',
                            text: 'Thanks for signing up pleasure to see you!',
                            html: '<h1>Thanks for signing up!</h1><p>Great to see you ahead its our pleasure</><p><span>Here is the login link- <a href="http://localhost:3000/login">Login here</a></span></p>'
                        }
                        sgMail.send(msg)
                            .then(() => {
                                console.log('email sent')
                            })
                            .catch((err) => {
                                console.log('err in sending email- ', err)
                            })
                    })
                    .catch((err) => {
                        console.log('err in saving user- ', err)
                    })
                res.redirect('/login')
            }
        })
        .catch((err) => {
            console.log('err in checking already email exist- ', err)
        })
}

exports.getLogin = (req, res) => {
    let email = null;
    if (req.session.isLoggedIn) {
        email = req.session.user.email
    }

    if (req.session.isLoggedIn) {
        console.log('already logged in')
        return res.redirect('/')
    }
    else {
        res.render('login', {
            title: 'login page',
            isAuthenticated: req.session.isLoggedIn,
            email: email
        })
    }
}

exports.postLogin = (req, res) => {
    const email = req.body.email
    const password = req.body.password

    userModal.find({ email: email })
        .then((user) => {
            let isPassMatched;
            if (user.length > 0) {
                isPassMatched = bcrypt.compareSync(password, user[0].password)
            }

            if (user.length === 0) {
                console.log('email doesnt exist signup first!')
                return res.redirect('/signup')
            }
            else if (user.length > 0 && isPassMatched && !req.session.isLoggedIn) {
                //generate token now
                req.session.user = user[0]
                req.session.isLoggedIn = true
                req.session.save((err) => {
                    if (err) {
                        console.log('err in saving session- ', err)
                    }
                    console.log('session saved success!')
                    return res.redirect('/')
                })
            }
            else {
                console.log('password not matched')
                return res.redirect('/login')
            }
        })
        .catch((err) => {
            console.log('err in finding user- ', err)
        })

}

exports.signOut = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('err in session destroying', err)
            return res.redirect('/')
        }
        else {
            console.log('session destroyed success!')
            return res.redirect('/login')
        }
    })
}

exports.getReset = (req, res, next) => {
    let email = null;
    if (req.session.isLoggedIn) {
        email = req.session.user.email
    }
    res.render('reset-1', {
        title: 'reset page',
        isAuthenticated: req.session.isLoggedIn,
        email: email
    })
}

exports.postReset = (req, res, next) => {
    const email = req.body.email

    userModal.findOne({ email: email })
        .then((user) => {
            if (user) {
                crypto.randomBytes(10, (err, buffer) => {
                    if (err) {
                        console.log('err in creating token- ', err)
                    }
                    else {
                        const token = buffer.toString('hex')
                        console.log('token- ', token)

                        const updatedUser = new userModal({
                            name: user.name,
                            email: user.email,
                            password: user.password,
                            resetToken: token,
                            resetTokenExp: Date.now() + 3600000
                        })
                        updatedUser.save()
                            .then((savedUpdatedUser) => {
                                userModal.findOneAndDelete({ email: email })
                                    .then((deletedUser) => {
                                        console.log('deleted outdated user- ', deletedUser)
                                    })
                                    .catch((err) => {
                                        console.log('err in deleting outdated user- ', err)
                                    })
                                console.log('updated user saved- ', savedUpdatedUser)
                            })
                            .catch((err) => {
                                console.log('err in saving updated user- ', err)
                            })
                        const msg_2 = {
                            from: 'sahidafridi0076@gmail.com',
                            to: email,
                            subject: 'Password Reset',
                            text: 'here you reset your password',
                            html: `<p>reset your password- <a href='http://localhost:3000/reset/${token}'>reset here</a></p>`
                        }
                        sgMail.send(msg_2)
                            .then(() => {
                                console.log('email sent for reset password')
                            })
                            .catch((err) => {
                                console.log('err in sending email for reset password- ', err)
                            })
                        return res.redirect('/')
                    }
                })
            } else {
                console.log('email not found for reset password signup first')
                return res.redirect('/signup')
            }
        })
        .catch((err) => {
            console.log('err in finding user for reset password- ', err)
        })
}

exports.getReset_2 = (req, res, next) => {
    const token = req.params.resetToken

    userModal.findOne({ resetToken: token, resetTokenExp: { $gt: Date.now() } })
        .then((user) => {
            if (user) {
                console.log('token verified!')
                let email = null;
                if (req.session.isLoggedIn) {
                    email = req.session.user.email
                }
                return res.render('reset-2', {
                    title: 'reset page',
                    isAuthenticated: req.session.isLoggedIn,
                    email: email,
                    token: token
                })
            }
            else {
                console.log('token has not verified')
                return res.redirect('/login')
            }
        })
}

exports.updatePassword = (req, res, next) => {
    const token = req.body.token
    const newPassword = req.body.newPassword

    bcrypt.hash(newPassword, 12)
        .then((hassedNewPass) => {
            userModal.findOne({ resetToken: token })
                .then((user) => {
                    const newPassUser = new userModal({
                        name: user.name,
                        email: user.email,
                        password: hassedNewPass,
                        resetToken: null,
                        resetTokenExp: null
                    })
                    newPassUser.save()
                        .then((updatedPassUser) => {
                            userModal.findOneAndDelete({ resetToken: token })
                                .then((oldPassUser) => {
                                    console.log('deleted old password user- ', oldPassUser)
                                })
                                .catch((err) => {
                                    console.log('err in deleting old password user- ', err)
                                })
                            console.log('user with new password- ', updatedPassUser)
                            return res.redirect('/login')
                        })
                        .catch((err) => {
                            console.log('err in saving user with new password- ', err)
                        })

                })
                .catch((err) => {
                    console.log('err in finding user for update password', err)
                })
        })
        .catch((err) => {
            console.log('err in hassing new password')
        })
}

exports.payment = (req, res, next) => {
    const amount = req.body.amount
    console.log('is it working-', amount)
    var options = {
        amount: amount * 100,
        currency: "INR",
        receipt: "order_rcptid_11",
    };

    instance.orders.create(options, function (err, order) {
        console.log("created order is-", order, " and err is-", err);
        return res.render('checkout', {
            order: order
        })
    });
}

exports.saveOrder = (req, res, next) => {
    const orderId = req.body.razorpay_order_id

    const newOrder = new orderModel({
        orderId: orderId
    })
    newOrder.save()
        .then((savedOrder) => {
            console.log('new saved order-', savedOrder)
            
            const document = new pdfDocument()
            document.pipe(fs.createWriteStream(path.join(__dirname, '..', 'invoices', `${savedOrder.orderId}.pdf`)))
            document.text('Order id- ' + savedOrder.orderId)
            document.end()

            return res.redirect('/orders')
        })
        .catch((err) => {
            console.log('err in saving new order-', err)
            return res.redirect('/')
        })
}

exports.getOrders = (req, res, next) => {
    orderModel.find()
        .then((orders) => {
            let email = null;
            if (req.session.isLoggedIn) {
                email = req.session.user.email
            }
            return res.render('orders', {
                title: 'orders page',
                isAuthenticated: req.session.isLoggedIn,
                email: email,
                orders: orders
            })
        })
        .catch((err) => {
            console.log('err in fetching orders-', err)
        })
}

exports.download = (req, res, next) => {
    const orderId = req.params.orderId

    const downloader = new Downloader({
        url: `http://localhost:3000/${orderId}.pdf`,
        directory: 'downloaded-invoices'
    })

    downloader.download()
        .then(() => {
            console.log('download success!')
            res.redirect('/orders')
        })
        .catch(() => {
            console.log('err in downloading')
        })
}