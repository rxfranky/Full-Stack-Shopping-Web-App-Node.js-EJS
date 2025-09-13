const productModel = require('../models/products')
const fs = require('fs')
const path = require('path')
const cartModel = require('../models/cart')


exports.addProductForm = (req, res, next) => {
    let email = null;
    if (req.session.isLoggedIn) {
        email = req.session.user.email
    }
    res.render('addProducts', {
        title: 'add product',
        isEdit: false,
        isAuthenticated: req.session.isLoggedIn,
        email: email
    })
}

exports.getProducts = (req, res, next) => {
    productModel.find({ creater: req.session.user })
        .then((products) => {
            let email = null;
            if (req.session.isLoggedIn) {
                email = req.session.user.email
            }
            return res.render('admin-products', {
                title: 'admin products page',
                isAuthenticated: req.session.isLoggedIn,
                email: email,
                products: products
            })
        })
        .catch((err) => {
            console.log('err in fetching specific user admin products-', err)
        })
}

exports.postProducts = (req, res, next) => {
    const title = req.body.title
    const price = req.body.price
    const desc = req.body.desc
    const imageUrl = req.file.originalname
    const creater = req.session.user
    const id = req.params.id

    productModel.find({ title: title } || { imageUrl: imageUrl } || { desc: desc })
        .then((product) => {
            if (product.length > 0 && id === '!edit') {
                console.log('product with same title or desc or image already exists')
                res.redirect('/')
            }
            else {
                const product = new productModel({
                    title: title,
                    price: price,
                    desc: desc,
                    imageUrl: imageUrl,
                    creater: creater
                })

                product.save()
                    .then((product) => {
                        if (id && id !== '!edit') {
                            productModel.findByIdAndDelete(id)
                                .then((delProd) => {
                                    fs.unlink(path.join(__dirname, '..', 'images', delProd.imageUrl), (err) => {
                                        if (err) {
                                            console.log('err in deleting old product image-', err)
                                        }
                                        console.log('deleting of image of old deleted product success!')
                                    })
                                    console.log('old deleted product-', delProd)
                                })
                                .catch((err) => {
                                    console.log('err in deleting old item-', err)
                                })
                        }
                        console.log('new product added-', product)
                        return res.redirect('/products')
                    })
                    .catch((err) => {
                        console.log('err during posting product-', err)
                    })
            }
        })
        .catch((err) => {
            console.log('some err in matching prod- ', err)
        })
}

exports.deleteProduct = (req, res, next) => {
    const id = req.body.id

    productModel.findByIdAndDelete(id)
        .then((deletedProd) => {
            fs.unlink(path.join(__dirname, '..', 'images', deletedProd.imageUrl), (err) => {
                if (err) {
                    og('err came in deleting file- ', err)
                }
                console.log('unlink file success')
            })
            console.log("deleted product success- ", deletedProd)

            cartModel.findOne({ title: deletedProd.title })
                .then((product) => {
                    if (product) {
                        cartModel.deleteOne({ title: deletedProd.title })
                            .then((delProd) => {
                                console.log('deleted from cart also-', delProd)
                            })
                            .catch((err) => {
                                console.log('err in deleting from cart-', err)
                            })
                    }
                })
                .catch((err) => {
                    console.log('err in finding in cart-', err)
                })
        })
        .catch((err) => {
            console.log('err came during del prod- ', err)
        })

    res.redirect('/products')
}

exports.editProduct = (req, res, next) => {
    const id = req.body.id
    const isEdit = req.query.edit

    productModel.findById(id)
        .then((product) => {
            let email = null;
            if (req.session.isLoggedIn) {
                email = req.session.user.email
            }
            res.render('addProducts', {
                product: product,
                title: 'edit page',
                isEdit: isEdit,
                isAuthenticated: req.session.isLoggedIn,
                email: email,
                id: id
            })
        })
        .catch((err) => {
            console.log('err occured during edit prod- ', err)
        })
}