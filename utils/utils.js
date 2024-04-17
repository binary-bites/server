import { storageBucket } from '../utils/firebase.js'  

export function checkInput(requiredFields, body) {

    const missingFields = requiredFields.filter(field => !body[field]);

   if (missingFields.length > 0) {
       throw Error(`Missing required field(s): ${missingFields.join(', ')}`);
   }

   return 'all good';
 }

 export const uploadImageToStorage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject('No image file');
      }
      let newFileName = `pictures/${Date.now()}_${file.originalname}`;
  
      let fileUpload = storageBucket.file(newFileName);
  
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });
  
      blobStream.on('error', (error) => {
        reject('Something is wrong! Unable to upload at the moment.');
      });
  
      blobStream.on('finish', () => {
        // After upload, generate a signed URL for read access
        fileUpload.getSignedUrl({
          action: 'read',
          expires: '03-09-2491', // Use a far future date or adjust according to your needs
        })
        .then(signedUrls => {
          // signedUrls[0] contains the URL you can use to publicly access the file
          console.log("URL", signedUrls[0]);
          resolve(signedUrls[0]);
        })
        .catch(error => {
          reject('Failed to obtain signed URL');
        });
      });
  
      blobStream.end(file.buffer);
    });
  };
