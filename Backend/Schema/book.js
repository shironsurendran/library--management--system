const mongoose = require('mongoose')
const Schema = mongoose.Schema

const bookSchema = new Schema({
            bookName:{type:String},
            authorName:{type:String},
            publisher:{type:String},
            language:{type:String},
            description:{type:String},
            bookCount:Number,
            bookId:{type:String, unique:true},
            price:Number,
            ISBN:Number,
            image:String,
            bookReleaseDate:{type:String, default:Date.now()}
})


module.exports = mongoose.model('book', bookSchema)