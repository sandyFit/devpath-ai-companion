const express = require('express');
const morgan = require('morgan');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the modular Express.js server!' });
});
app.use('/', uploadRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start
const PORT = process.env.PORT || 3800;
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
