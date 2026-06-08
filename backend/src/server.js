require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ ResumeAI Backend running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}).catch((err) => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
