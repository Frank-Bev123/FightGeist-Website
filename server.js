const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path'); // Require 'path' only once here

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Explicit root route to serve index.html (optional but recommended)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit', (req, res) => {
  const formData = req.body;

  // Process disciplines field
  if (formData['disciplines[]']) {
    formData.disciplines = Array.isArray(formData['disciplines[]'])
      ? formData['disciplines[]'].join(', ')
      : formData['disciplines[]'];
    delete formData['disciplines[]'];
  }

  let data = [];

  // Load existing Excel file or create a new one
  if (fs.existsSync('UserData.xlsx')) {
    const workbook = XLSX.readFile('UserData.xlsx');
    const sheetName = workbook.SheetNames[0];
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }

  // Add new form data
  data.push(formData);

  // Convert JSON to worksheet and save
  const newWorkbook = XLSX.utils.book_new();
  const newSheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Users');
  XLSX.writeFile(newWorkbook, 'UserData.xlsx');

  res.send({ message: 'Data saved to Excel!' });
});


app.get('/view-data', (req, res) => {
  // Construct the absolute path for the Excel file
  const excelFile = path.join(__dirname, 'UserData.xlsx');

  if (!fs.existsSync(excelFile)) {
    return res.send('<h2>No data found.</h2>');
  }

  const workbook = XLSX.readFile(excelFile);
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  // Create HTML table
  let table = `<h2>Submitted User Data</h2><table border="1" cellpadding="8" cellspacing="0"><tr>`;
  if (data.length > 0) {
    Object.keys(data[0]).forEach(key => {
      table += `<th>${key}</th>`;
    });
    table += `</tr>`;

    data.forEach(row => {
      table += `<tr>`;
      Object.values(row).forEach(value => {
        table += `<td>${value}</td>`;
      });
      table += `</tr>`;
    });
  } else {
    table += `<tr><td>No data available</td></tr>`;
  }
  table += `</table>`;

  res.send(table);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
