const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const fs = require('fs')
const multer = require('multer')

// setup express app
let app = express()
app.use(cors())
app.use(bodyParser.json())
app.listen(7000,function(){
    console.log("Server listing to port 7000")
})

// setup multer
const path = './attach'
let storage = multer.diskStorage(
    {
        destination: 
            function(req,file, cb)
            {
                cb(null,path)
            },  
        filename:
            function(req, file, cb)
            {
                cb(null,`${file.fieldname}-${Date.now()}.${file.originalname.split('.')[file.originalname.split('.').length-1]}`)
            }

    }
)

let upload = multer({storage:storage}).single('Image')
app.use('/images',express.static('attach'));

// connect to mongoose
mongoose.connect("mongodb://localhost/library",{
    useCreateIndex:true,
    useUnifiedTopology:true,
    useNewUrlParser:true
})


const bookCollection = require('./Schema/book')
const issueColletion = require('./Schema/issueBook')




// add Book
app.post('/api/addBook', function(req,res){
    upload(req, res, function(err){
        if(err){
            console.log("err in uploading"+err)
        }
        else{
           let bookName = req.body.bookName
           let authorName = req.body.authorName
           let publisher = req.body.publisher
           let language = req.body.language
           let description = req.body.description
           let bookCount = req.body.bookCount
           let bookId = req.body.bookId
           let price = req.body.price
           let ISBN = req.body.ISBN
           let image = req.file.filename

           let  ins = new bookCollection(
               {
                bookName:bookName,
                authorName:authorName,
                publisher:publisher,
                language:language, 
                description:description, 
                bookCount:bookCount, 
                bookId:bookId,
                price:price,
                ISBN:ISBN,
                image:image
            })

            ins.save(function(err){
                if(err){
                    console.log("err while inserting in DB"+err)
                    res.json({'err':true,'msg':'Err while adding Book to DB'})
                }
                else{
                    console.log('book added successfully')
                    res.json({'err':false,'msg':'Book Added Successfully'})
                }
            })
        }

    })
})


// fetch all books
app.get('/api/fetchBooks', function(req,res){
    let query = bookCollection.find({}).sort({'bookReleaseDate':-1})
    query.exec(function(err,data){
        if(err){
            console.log("Error in fetching books")
            res.json({err:'true','data':[]})
        }
        else{
            console.log("Books fetched successfully");
            res.json({err:'false','data':data})
            
        }
    })
})

// search books
app.get('/api/findBooks/:searchString',function(req,res){
    let queryString = req.params.searchString
    console.log("queryString "+queryString)
    let query=bookCollection.find({ $text: { $search: queryString } }).sort({'date_created':-1});
    query.exec(function(err, data){
        if(err)
        {
            console.log(err)
            res.json({err:'true','data':[]})
        }
        else{
            console.log(data)
            res.json({err:'false','data':data})
        }
    })
})


// delete a book from library
app.get('/api/deleteBook/:id',function(req, res){
    
    let a= req.params.id
    console.log(typeof a)
    console.log(a)


    // delete   image
    let findBookQuery = bookCollection.find({'bookId':a})
    findBookQuery.exec(function(err, data){
        if(err){}
        else{
            
            fs.unlink('./attach/'+data[0].image, function(err){

            })
        }
    })

    let query = bookCollection.deleteOne({'bookId':a})
    query.exec(function(err, data){
        if(err)
        {
            console.log(err)
            res.json({'err':false, 'msg':'error in deleting book'})
        }
        else{
            console.log("book deleted")
            console.log(data)
            res.json({'err':true, 'msg':'book deleted', 'data':data})
        }
    })
})


// save issued book
app.post('/api/issueBook',function(req, res){
    
    let bid = req.body.bookId
    let ct = req.body.count-1
    console.log("______________"+bid +" "+ ct)

    bookCollection.update({'bookId':bid}, {$set:{'bookCount': ct}}, function(err,data){
        if(err){
            console.log("update"+err)
        }
        else{
            console.log("update"+data)
        }
    })
    
    console.log(req.body.bookId+" "+ req.body.count)
    
    bookCollection.find({'bookId':req.body.bookId}, function(err, data){
        if(err){
            console.log(err);
            res.json({'err':false, 'msg':'error in issue book'})
        }
        else{
            console.log(data);
            
            


            let ins = new issueColletion({
                studentName:'shiron',
                issueId: Date.now().toString(),
                rollNo: "1P22MC049",
                book:data[0],
                issue:true,
                return: false,
                returnTime: null,
                issueTime: Date.now(),
                returnedAfterXDays: null
            })
            ins.save(function(err, data){
                if(err){
                    console.log(err)
                    res.json({'err':true, 'msg':'error in issue book'})
                }
                else{
                    console.log('book issued')
                    res.json({'err':false, 'msg':'book issued', 'data':data})
                }
            })
            
            
        }
    })
})

// fetch issued Books
app.get('/api/issuedBooks', function(req, res){
    let query = issueColletion.find({'issue':true}).sort({issueTime:-1})
    query.exec(function(err, data){
        if(err){
            console.log(err)
            res.json({'err':true})
        }
        else{


            console.log({'err': false, 'data':data})
            res.json({'err': false, 'data':data})
        }
    })
})

//  logs to admin
app.get('/api/issuedLogs', function(req, res){
    let query = issueColletion.find({}).sort({issueTime:-1})
    query.exec(function(err, data){
        if(err){
            console.log(err)
            res.json({'err':true})
        }
        else{


            console.log({'err': false, 'data':data})
            res.json({'err': false, 'data':data})
        }
    })
})

// add certain number of books of a particular type to library
app.post('/api/incrementBook', function(req, res){
    let incr = Number(req.body.increment) + Number(req.body.prevCount)
    let bookId = req.body.bookId
    let query = bookCollection.update({'bookId':bookId}, {$set:{'bookCount':incr}})
    query.exec(function(err, data){
        if(err){
            console.log(err)
            res.json({"errr":true})
        }
        else{
            console.log("incremented book count by"+ incr)
            res.json({"err": false})
        }
    })
})

function diffrenceBwDates(issueDate){
    let returnTime = new Date(Date.now())
    returnTime.getTime()
    let issueTime = new Date(issueDate)
    issueTime = issueTime.getTime()
    return Math.floor((returnTime-issueTime)/(1000*3600*24))
}



// student return the book
app.post('/api/returnBook', function(req, res){
    let bookId = req.body.bookId
    let bookCount
    let issueId = req.body.issueId
    let issueDate =req.body.issueTime
    console.log(bookId+" "+bookCount+" "+ issueId)
    let query = bookCollection.find({'bookId':bookId})
    query.exec(function(err, data){
        if(err){
            console.log(err)
            res.json({'msg':'err in returning book'})
        }
        else{
            
            bookCount = data[0].bookCount +1
            
            

            let updateCountQuery = bookCollection.update({'bookId':bookId}, {$set:{'bookCount': bookCount}})
            updateCountQuery.exec(function(err, data){
                if(err)
                    console.log('err in incrementing returned book count')
                else
                    console.log('return count inc by 1 ')
            })


            let updateIssueToFalse = issueColletion.update({'issueId':issueId}, {$set:{'issue':false, 'return':true, 'returnTime': Date.now(), 'returnedAfterXDays': diffrenceBwDates(issueDate)}})
            updateIssueToFalse.exec(function(err, data){
                if(err)
                    console.log('err in turning issue to fale')
                else
                    console.log('issue change to false '+data)
                })

            
                 
                
            res.json({'msg':'returned suucessfully'})
        }
    })
})








