// 3rd party modules
const express = require('express');
const dotenv = require('dotenv');
//core modules
const path = require('path');
//custom modules
const rootPath = require('./utils/rootPath');

dotenv.config({
  path: path.join(rootPath, 'config', 'config.env'),
});

const app = express();

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port : ${PORT}`
  );
});
