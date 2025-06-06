<p align="left">
  <img src="assests/images/feather-wing-svgrepo-com.svg" alt="CloudBlog Logo" width="40" style="vertical-align:middle; margin-right:10px"/>
  <span style="font-size:2em; vertical-align:middle;"><b>CloudBlog - A Modern Blogging Platform</b></span>
</p>

CloudBlog is a modern, responsive blogging platform built with HTML, CSS, and JavaScript, powered by Firebase. It provides a seamless experience for both readers and content creators.

## 🌟 Features

- **User Authentication**
  - Secure login and registration system
  - User profile management
  - Protected routes for authenticated users

- **Blog Management**
  - Create, edit, and delete blog posts
  - Rich text editor for content creation
  - Image upload support
  - Post categorization and tagging

- **Modern UI/UX**
  - Responsive design for all devices
  - Clean and intuitive interface
  - Real-time updates
  - Modal-based post viewing

- **Firebase Integration**
  - Firestore for database
  - Firebase Authentication
  - Firebase Storage for media files
  - Real-time data synchronization

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Firebase
  - Firestore
  - Authentication
  - Storage
- Font Awesome Icons

## 📦 Project Structure

```
cloudblog/
├── admin/           # Admin dashboard files
├── assests/         # Storing of images and videos
├── auth/            # Authentication related files
├── blog/            # Blog post templates
├── components/      # Reusable UI components
├── config/          # Configuration files
├── css/            # Stylesheets
├── js/             # JavaScript files
├── pages/          # Additional pages
└── scripts/        # Utility scripts
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cloudblog.git
   ```

2. **Set up Firebase**
   - Create a new Firebase project
   - Enable Authentication, Firestore, and Storage
   - Add your Firebase configuration to `config/firebase.js`

3. **Run locally**
   - Open `index.html` in your browser
   - Or use a local server for development

## 🔧 Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable required services:
   - Authentication
   - Firestore Database
   - Storage
3. Update the Firebase configuration in `config/firebase.js`

## 📱 Screenshots

![Home Page](screenshots/HomePage.png)
![Blog Post](screenshots/Blogs.png)
![Dashboard](screenshots/Dashboard.png)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Samarth Uday

## 🙏 Acknowledgments

- Firebase for providing the backend infrastructure
- Font Awesome for the icons
- All contributors who have helped shape this project
