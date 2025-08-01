# Image Upload Setup Guide

This guide explains how to configure image upload functionality using Cloudinary for your Full-Stack E-Commerce MERN application.

## Prerequisites

1. **Cloudinary Account**: Sign up at [cloudinary.com](https://cloudinary.com) (free tier available)
2. **Upload Preset**: Create an unsigned upload preset in your Cloudinary dashboard

## Configuration Steps

### 1. Backend Environment Variables

Your backend `.env` file should already contain these variables:

```env
# MongoDB Connection URI
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT Token Secret Key
TOKEN_SECRET_KEY=your-super-secret-jwt-key-here-change-this-in-production

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Server Port
PORT=8080
```

### 2. Frontend Environment Variables

Create a `.env` file in the `frontend` directory with:

```env
# Cloudinary Configuration for Image Upload
REACT_APP_CLOUD_NAME_CLOUDINARY=your-cloudinary-cloud-name-here
```

**To get your Cloudinary cloud name:**
1. Log into your Cloudinary dashboard
2. Find your cloud name in the dashboard URL: `https://console.cloudinary.com/console/c-[YOUR_CLOUD_NAME]/`
3. Or check the "Account Details" section in your dashboard

### 3. Cloudinary Upload Preset Setup

1. Go to your Cloudinary dashboard
2. Navigate to **Settings** → **Upload**
3. Scroll down to **Upload presets**
4. Click **Add upload preset**
5. Set the preset name to: `mern_product`
6. Set **Signing Mode** to: `Unsigned`
7. Configure other settings as needed (folder, transformations, etc.)
8. Save the preset

### 4. Image Upload Implementation

The application uses the `uploadImage` helper function located at:
`frontend/src/helpers/uploadImage.js`

This function:
- Uploads images to Cloudinary using the configured cloud name
- Uses the `mern_product` upload preset
- Returns the Cloudinary response with the uploaded image URL

### 5. Usage Example

```javascript
import uploadImage from './helpers/uploadImage';

const handleImageUpload = async (imageFile) => {
  try {
    const uploadResponse = await uploadImage(imageFile);
    const imageUrl = uploadResponse.secure_url;
    console.log('Image uploaded successfully:', imageUrl);
    // Use imageUrl in your application
  } catch (error) {
    console.error('Image upload failed:', error);
  }
};
```

## Troubleshooting

### Common Issues:

1. **"Invalid cloud name" error**
   - Verify your `REACT_APP_CLOUD_NAME_CLOUDINARY` is correct
   - Restart your React development server after changing .env

2. **"Upload preset not found" error**
   - Ensure the upload preset `mern_product` exists in your Cloudinary account
   - Verify it's set to "Unsigned" mode

3. **CORS errors**
   - Check that your Cloudinary account allows uploads from your domain
   - For development, localhost should work by default

### Environment Variables Checklist:

**Backend (.env):**
- ✅ MONGODB_URI
- ✅ TOKEN_SECRET_KEY  
- ✅ FRONTEND_URL
- ✅ PORT (optional)

**Frontend (.env):**
- ❌ REACT_APP_CLOUD_NAME_CLOUDINARY (needs your actual cloud name)

## Security Notes

- Never commit your actual environment variables to version control
- Use strong, unique values for TOKEN_SECRET_KEY in production
- Consider using signed upload presets for production environments
- Implement proper file type and size validation

## Next Steps

1. Replace `your-cloudinary-cloud-name-here` with your actual Cloudinary cloud name
2. Create the `mern_product` upload preset in your Cloudinary dashboard
3. Test image upload functionality in your application
4. Implement proper error handling and loading states in your UI

For the sample images provided in your Google Drive link, you can upload them through your application once the setup is complete.
