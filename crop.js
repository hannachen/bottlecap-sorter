process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'bottle-cap-sorter-0522718655b9.json')

import sharp from 'sharp'
import path from 'path'
import Storage from '@google-cloud/storage' // Imports the Google Cloud client library

// Instantiates a client
const storageClient = Storage()
const bucketName = 'bottle-cap-sorter'

const file = path.join(__dirname, 'snapshots/snapshot.jpg')
const target = path.join(__dirname, 'snapshots/cropped.jpg')

sharp(file)
  .extract({ left: 580, top: 705, width: 475, height: 475 })
  .toFile(target)
  .then( data => {
    console.log('cropped', data)
    // Upload file
    storageClient
      .bucket(bucketName)
      .upload(target)
      .then( results => {
        console.log(`${target} uploaded to ${bucketName}`)
        const filename = 'cropped.jpg'
        storageClient
          .bucket(bucketName)
          .file(filename)
          .makePublic()
          .then(() => {
            console.log(`gs://${bucketName}/${filename} is now public as https://storage.googleapis.com/bottle-cap-sorter/cropped.jpg.`);
          })
          .catch((err) => {
            console.error('ERROR:', err)
          });
      })
      .catch((err) => {
        console.error('ERROR:', err)
      });
  })
  .catch( err => {
    console.log(err)
  });