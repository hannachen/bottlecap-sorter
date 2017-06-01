process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'bottle-cap-sorter-0522718655b9.json')

const path = require('path')

// Imports the Google Cloud client library
const Vision = require('@google-cloud/vision')

// Google Cloud Platform project ID
const projectId = 'bottle-cap-sorter'

// Instantiates a client
const visionClient = Vision({
  projectId: projectId
})

// The name of the image file to annotate
const fileName = 'gs://bottle-cap-sorter/snapshot.jpg'

// Performs label detection on the image file
visionClient.detectLabels(fileName)
  .then((results) => {
    const labels = results[0]

    console.log('Labels:')
    labels.forEach((label) => console.log(label))
  })
  .catch((err) => {
    console.error('ERROR:', err)
  })