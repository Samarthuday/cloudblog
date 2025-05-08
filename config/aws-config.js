// config/aws-config.js
// AWS SDK client config (browser-compatible)

// If you're using AWS Amplify or S3 for uploads:
export const awsConfig = {
    region: "us-east-1",
    accessKeyId: "YOUR_AWS_ACCESS_KEY",      // Should be environment vars in real setup
    secretAccessKey: "YOUR_AWS_SECRET_KEY",  // Don't expose these in production!
    bucketName: "your-cloudblog-bucket"
  };
  