const mongoose = require('mongoose')

const Schema = mongoose.Schema

const cartSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
    }
})

module.exports = mongoose.model('cart', cartSchema)