import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Teameit API server running on port ${port}`);
});
