const mongoose = require('mongoose')
const Schema = mongoose.Schema

const issueSchema= new Schema({
    studentName: String,
    issueId: String,
    rollNo: String,
    book: Object,
    issue: Boolean,
    return: Boolean,
    returnTime: Date,
    issueTime: Date,
    returnedAfterXDays: Number

})

module.exports = mongoose.model('issue', issueSchema)