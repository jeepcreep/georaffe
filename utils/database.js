// import mongoose from 'mongoose';

// const MONGODB_URI = process.env.MONGODB_URI;

// if (!MONGODB_URI) {
//   throw new Error(
//     'Please define the MONGODB_URI environment variable inside .env.local'
//   );
// }

// let cached = global.mongoose;

// if (!cached) {
//   cached = global.mongoose = { conn: null, promise: null };
// }

// const connectToDatabase = async () => {
//   if (cached.conn) {
//     return cached.conn;
//   }

//   if (!cached.promise) {
//     const opts = {
//       dbName: 'georef'
//     };

//     cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
//       return mongoose;
//     });
//   }
//   cached.conn = await cached.promise;
//   return cached.conn;
// }

// export default connectToDatabase;

import mongoose from 'mongoose';

//let connection = null;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectToDatabase = async () => {
    mongoose.set('strictQuery', true);
    //mongoose.set('timestamps', true);

    if (cached.conn) {
      return cached.conn;
    }
  
    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
      };
  
      cached.promise = mongoose.connect(process.env.MONGODB_URI, {
                dbName: process.env.MONGODB_DBNAME
            }).then((mongoose) => {
        return mongoose;
      });
    }
    cached.conn = await cached.promise;
    return cached.conn;

    // try {
    //     connection = await mongoose.createConnection(process.env.MONGODB_URI, {
    //         dbName: 'georef'
    //     }).asPromise();

    //     if (connection.readyState == 1) {
    //       console.log('db connection established!');
    //       return connection;
    //     }
    //     return null;
    // } catch (error) {
    //     console.log(error);
    // }
}

export default connectToDatabase;