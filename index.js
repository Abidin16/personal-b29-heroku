const { Router, query } = require('express')
const express = require('express')
const db = require('./connection/db')
const upload = require('./middlewares/uploadFile')

const bcrypt = require('bcrypt')                     // pemanggilan
const session = require ('express-session')
const flash = require('express-flash')


const app = express()
const PORT = process.env.PORT || 3000

let isLogin = true
let blogs = [
    {
        title: 'Pasar Coding di Indonesia Dinilai Masih Menjanjikan',
        post_at: '12 Jul 2021 22:30 WIB',
        author: 'Ichsan Emrald AlamsyahAb',
        content: 'Ketimpangan sumber daya manusia (SDM) di sektor digital masih menjadi isu yang belum terpecahkan. Berdasarkan penelitian '
    }
]
const month = [ 
    'January', 
    'February', 
    'March', 
    'April', 
    'May', 
    'June', 
    'July', 
    'August', 
    'September', 
    'October',
    'November',
    'Desember' 
]

function getFulltime(time){

    let date = time.getDate() 
    let monthIndex = time.getMonth() 
    let year = time.getFullYear() 
    let hours = time.getHours() 
    let minutes = time.getMinutes() 


    let fullTime = `${date} ${month[monthIndex]} ${year} ${hours}:${minutes} WIB`

    return fullTime
}


app.set('view engine', 'hbs')    //  set template engine

app.use('/public', express.static(__dirname+'/public'))  //   set folder to public
app.use('/uploads', express.static(__dirname+'/uploads'))  // middlewares
app.use( express.urlencoded({extended: false}))
app.use(
    session({
        cookie: {
            maxAge: 2 * 60 * 60 * 1000,
            secure: false,
            httpOnly: true
        },
        store: new session.MemoryStore(),
        saveUninitialized: true,
        resave: false,
        secret: "secretValue"
    })
)
app.use(flash())

app.get('/', function (req,res){

    db.connect(function(err, client, done){
        if (err) throw err

        client.query('SELECT * FROM index', function ( err,result){
            if (err) throw err
            let data = result.rows                  //rows = data yang di panggil di bagian rows (rows = bagian objeck{})

            data = data.map (function(item){
                return{
                    ...item,
                    isLogin : isLogin
                }
            })
        
            res.render('index', {isLogin: isLogin, card: data}) 
        })
    })
})


app.get('/form', function(req,res){
    res.render('form') // render file add-blog
})

// menampilkan data =>render
app.get('/blog', function(req, res){

    let query = `SELECT blog.id, blog.title, blog.content, blog.image, tb_user.name AS author, blog.post_at  FROM blog LEFT JOIN tb_user
    ON tb_user.id = blog.author_id`

    db.connect(function(err, client, done){
        if (err) throw err

        client.query(query, function ( err,result){
            if (err) throw err
            let data = result.rows

            data = data.map (function(blog){                    //manipulasi array  membuat edit dan delete
                return{
                    ...blog,
                        post_at :  getFulltime(blog.post_at),
                        post_age : getDistanceTime(blog.post_at),
                        isLogin : req.session.isLogin,
                        image: '/uploads/' + blog.image
                }
            })
            res.render('blog',
             {
                isLogin: req.session.isLogin,
                blogs: data,
                user: req.session.user
                
            }) 
        })
    })
})
    


app.get('/detail-blog/:id', function(req, res){
    let id = req.params.id
    

    let query = `SELECT blog.id, blog.title, blog.content, blog.image, tb_user.name AS author, blog.post_at  FROM blog  LEFT JOIN tb_user
ON tb_user.id = blog.author_id WHERE blog.id = ${id}`

    db.connect(function(err, client, done){
        if (err) throw err

        client.query(query, function ( err,result){
            if (err) throw err
            let data = result.rows[0]

           data= {
                            title: data.title,
                            content: data.content,
                            image: '/uploads/'+ data.image,
                            author: data.author,
                            post_at: getFulltime(data.post_at),
                            
                        }
            res.render('detail-blog', {
                                id : id, 
                                blog: data,
                                }) 
        })
    })
})


app.get('/add-blog', function(req,res){
    res.render('add-blog' ,{isLogin: req.session.isLogin,
                            user: req.session.user                    
        }) // render file add-blog
})

// untuk menerima data ke server = masukan middlewares di tengah route dan fungsi
app.post('/blog', upload.single('image'),function(req, res){
    let data = req.body

    if(!req.session.user){
        req.flash('danger', 'Please Login')
        return res.redirect('/add-blog')
    }

    if(!req.file.filename){
        req.flash('danger', 'Please insert all fields')
        return res.redirect('/add-blog')
    }

    let authorId = req.session.user.id
    let image = req.file.filename

    let query = `INSERT INTO blog(title, content, image, author_id) VALUES ('${data.title}', '${data.content}', '${image}', '${authorId}')`

    db.connect(function(err, client, done){
        if (err) throw err

        client.query(query, function ( err,result){
            if (err) throw err

            res.redirect('/blog')
        })
    })
})


app.get('/delete-blog/:id', function(req,res){
    let id = req.params.id

    let query = `DELETE FROM blog WHERE id = ${id}`

    db.connect(function(err, client, done){
        if (err) throw err

        client.query(query, function ( err,result){
            if (err) throw err

            res.redirect('/blog')
        })
    })

})

app.get('/edit-blog/:id' , function(req,res){
    let id = req.params.id
    let data = blogs[id]
    

    db.connect(function(err, client, done){
        if (err) throw err

        client.query(`SELECT * FROM blog `, function ( err,result){
            if (err) throw err

            let data= result.rows[0]
        
            res.render('edit-blog', {blogs: data, id}) 
        })
    })
})


app.post('/update-blog/:id', function(req, res){
        let id = req.params.id
        let data = req.body
        let query = `UPDATE blog SET title= '${data.title}', content = '${data.content}' WHERE id = '${id}'`

        db.connect(function(err, client, done){
            if (err) throw err
            
            client.query(query, function ( err,result){    
                if (err) throw err

                res.redirect('/blog')
            })
        })
})

app.get('/register' , function(req,res){
            res.render('register') 
})

app.post('/register' , function(req,res){
      const data = req.body

        const hashedPassword = bcrypt.hashSync(data.password, 10) // ini untuk mengenkripsi password dgn bantuan bcrypt

        let query = `INSERT INTO tb_user(name,email, password) VALUES ('${data.name}','${data.email}','${hashedPassword}')`

                db.connect(function (err, client, done) {
                if (err) throw err

                client.query(query, function (err, result) {
                if (err) throw err

                res.redirect('/login')
    })
  })    
})


app.get('/login' , function(req,res){
    // console.log(req.session)
    res.render('login') 
})

app.post('/login' , function(req,res){
    const { email, password } = req.body

    let query = `SELECT * FROM tb_user WHERE email = '${email}'`      //pengecekan apakah ada yang login 

    db.connect(function(err, client, done){                                   
        if (err) throw err

        client.query(query, function(err, result){
            if (err) throw err

            if(result.rows.length == 0){     //mengatasi klo ngga ada password & email
                req.flash('danger',"Email and Password don't match!")
                return  res.redirect('/login')
            }

            let isMatch = bcrypt.compareSync(password, result.rows[0].password)     // cocokan passsword

            if(isMatch) {                           //session penyimpanan sementara di sisi client
                req.session.isLogin = true          
                req.session.user = {
                    id: result.rows[0].id,
                    name:  result.rows[0].name,
                    email:  result.rows[0].email
                }

                req.flash('success', 'Login success')
                 res.redirect('/blog')

            }else{
                req.flash('danger', "Email and Password don't match!")
                res.redirect('/login')
            }
        })
    })
})

// hapus session
app.get('/logout', function(req, res){
    req.session.destroy()
    res.redirect('/blog')
})

// to bind and listen the connection on the specified host and post
app.listen(PORT, function(){
    console.log(`Server starting on PORT: ${PORT}`)
})

    // redirect = untuk mengembalikan kehalaman utama

function getDistanceTime(time) {
        let timePost = time;
        let timeNow= new Date();
    
       let distance = timeNow - timePost
    
        // convert to day
        let miliseconds = 1000    
        let secondsinHours = 3600  
        let hoursInDay = 23  
    
        let distanceDay =  Math.floor(distance /(miliseconds * secondsinHours * hoursInDay))
        

    if(distanceDay >= 1) {
        return(`${distanceDay} day ago`)
 }else {
     
     //  convert to hours => miliseconds 1 hours
     let distanceHours = Math.floor (distance / (1000 * 60 * 60))
     if( distanceHours >= 1) {
         return(`${distanceHours} hours ago`)
     } else {
         // convert to minutes  => milisecond in 1 second
         let distanceMinutes = Math.floor (distance / (1000 * 60))

         if (distanceMinutes >= 1 ) {
             return(`${distanceMinutes} minutes ago`)
         }else{
             let distenceSecond = Math.floor (distance / 1000)
             return(`${distenceSecond} second ago`)
         }
 }
 }
}

// setInterval(()=>{

//  renderBlog()

// },1000)

























//     1. ambil data yang ingin di edit
// 2. kirim data ke tampilan (hbs)
// 3. update data yang ingin diubah
// 4. kirim data terbaru ke server
// 5. manipulasi data yang ada di variable