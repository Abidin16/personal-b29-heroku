const multer = require('multer')

//initaalization multer diskstroge
//make destination file for upload
const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, "uploads")
    },
    filename: function (req, file, cb){
        cb(null, Date.now() + "-" + file.originalname)            //rename filename by data now() + original filename
    }
})

const upload = multer ({storage: storage})

module.exports = upload