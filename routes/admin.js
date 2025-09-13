const express = require('express')
const controllers = require('../controllers/admin')
const isAuth = require('../util/isAuth')

const router = express.Router()


router.get('/addProduct', controllers.addProductForm)
router.get('/products', isAuth, controllers.getProducts)
router.post('/addProduct/:id', isAuth, controllers.postProducts)

router.post('/deleteProduct', controllers.deleteProduct)
router.post('/editProduct', controllers.editProduct)

module.exports = router