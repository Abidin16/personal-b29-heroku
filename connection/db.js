const { Pool } = require ('pg')

const dbPool = new Pool({
    // database: 'Personal-web-b29',
    // port : 5432,
    // user : 'postgres',
    // password :'root'
    connectionString:'postgres://aewzwfsfmkzrym:22f72e7ed6f0e75cfc66803319dd006ce86ccf143fdd58a37e6f52e86ebc28d5@ec2-3-214-190-189.compute-1.amazonaws.com:5432/ddrir0jhbun5ma',
    ssl: {rejectUnauthorized:false} //security
})


    module.exports = dbPool