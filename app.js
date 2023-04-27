const express=require('express');
const app=express();
const bodyParser = require('body-parser');
const path=require('path');
const fs=require("fs")
const upload=require('./middelware/multer');
const Sequelize = require('sequelize');
const { Op } = require('sequelize'); 
const xlsx = require('xlsx'); 
const{Parser}=require("json2csv");
const ejs=require('ejs');
// const csv = require('csv-parser');
const csv=require('csvtojson');

const model=require("./models");
const user=model.User;
const port=process.env.port ||2000;
app.use(bodyParser.json({ limit: '50mb' }));

app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json());

app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

const static_path=path.join(__dirname,"../","public");
app.use(express.static(static_path));




app.get('/upload',(req,res)=>{
    res.render("upload");
})



//.................................csvparser
// app.post('/upload', upload.single('csvFile'), (req, res) => {
//     const fileExtension = req.file.originalname.split('.').pop();
//     console.log(fileExtension);
//     if (fileExtension !== 'csv') {
//       return res.status(400).send('Invalid file type');
//     }
  
//     const results = [];
   
//     console.log(req.file);
//     fs.createReadStream(req.file.path)
//     .pipe(csv())
//     .on('data', (data) => results.push(data))
//     .on('end', async (data) => {
//       // Insert the CSV data into the database
        
//       for (const result of results) {
//         const dat=await user.create(result);
//         console.log(dat);
//       }
//     //   Render the upload results page
//      res.send("file upload");
//     });
// })
  
  
// ................................

app.post('/upload', upload.single('csvFile'), async (req, res) => {
  try {

    const fileExtension = req.file.originalname.split('.').pop();
    console.log(fileExtension);
    if (fileExtension !== 'csv') {
      return res.status(400).send('Invalid file type');
    }
//.........................................
    const csvFilePath = req.file.path;
    console.log("File path: " + csvFilePath);
    const workbook = xlsx.readFile(csvFilePath);
    const sheetName = workbook.SheetNames[0];
    console.log("Sheet name: " + sheetName);
    const worksheet = workbook.Sheets[sheetName];
    console.log("Worksheet: ", worksheet);

    // Convert CSV to JSON using csvtojson module
    const jsonObj = await csv({headers:['id','name','email','role']}
    
 ).fromFile(csvFilePath);
    console.log("JSON Object: ", jsonObj);

    // Create a Set to store email addresses and check for duplicates
    const uniqueJsonObj = [];
    const emails = new Set();
    console.log(emails)
    for (const obj of jsonObj) {
      const email = obj.email;
      if (emails.has(email)) {
        
        console.log(`Duplicate email found in Excel file: ${email}`);
      } else {
        try {
          const existingData = await user.findOne({ where: { email } });
          if (existingData) {
            console.log(`Email '${email}' already exists in the database.`);
          } else {
            await user.create(obj);
            uniqueJsonObj.push(obj);
            emails.add(email);
          }
        } catch (error) {
          console.log(`Error inserting row with email '${email}': ${error.message}`);
        }
      }
    }
    // res.send(`Inserted ${uniqueJsonObj.length} unique rows into the database`)
    const users = await user.findAll();
    res.render('cs', { users });
    
    console.log(`Inserted ${uniqueJsonObj.length} unique rows into the database`);
   

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }

});




app.post('/download', async(req, res, )=>{

  const users = await user.findAll();

      const data = JSON.parse(JSON.stringify(users));

      //convert JSON to CSV Data

      const fields = ['id','name', 'role', 'email'];

      const json_data = new Parser({fields});

      const csv_data = json_data.parse(data);

      const filePath = path.join(__dirname, 'sample_data.csv');

      fs.writeFileSync(filePath,csv_data);

      res.setHeader("Content-Type", "text/csv");

      res.setHeader("Content-Disposition", "attachment; filename=sample_data.csv");

      res.status(200).end(csv_data);

  });

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });