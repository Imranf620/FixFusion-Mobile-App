FixFusion - Mobile Frontend
This README provides an overview and setup instructions for the FixFusion mobile application, which serves as the presentation layer for both customers and technicians.

Overview
The FixFusion mobile application is built using React Native, enabling cross-platform development for both iOS and Android. It provides the user interface for customers to request repair services and for technicians to browse and bid on these requests. Key features include:

User Authentication: Secure login and registration for both customer and technician roles.
Repair Request Management: Customers can create, view, and manage their repair requests, including uploading images and specifying location.
Bidding System: Technicians can view available repair requests and submit bids. Customers can review and select bids.
Real-time Chat: Direct communication between customers and technicians for clarification and coordination.
User Profiles: Management of user information, including skills and certifications for technicians.
Notifications: Real-time updates on request status, bids, and messages.
Rating and Reviews: Customers can rate and leave feedback for technicians upon completion of a service.
Location Services: Integration with Google Maps API for accurate location tracking and display.
Machine Learning Recommendations: (Future) Display of recommended technicians or services based on request details.
Technology Stack
Framework: React Native (version 0.71+)
State Management: Redux Toolkit
Navigation: React Navigation (version 6+)
UI Components: React Native Paper
Maps Integration: React Native Maps (leveraging Google Maps API)
Real-time Communication: Socket.IO Client
Local Storage: AsyncStorage & SQLite
Form Validation: Formik with Yup
API Requests: Axios
Image Handling: React Native Image Picker & React Native Fast Image
Analytics: Firebase Analytics
Testing: Jest & React Native Testing Library
Development Environment Setup
Install Node.js and npm/Yarn: Ensure you have Node.js (version 18+) and npm or Yarn installed on your development machine.
Install Expo CLI: It's recommended to use Expo for a smoother development experience with React Native.
Bash

npm install -g expo-cli
# or
yarn global add expo-cli
Clone the Repository: Clone the FixFusion project repository to your local machine.
Bash

git clone <repository_url>
cd FixFusion/mobile  # Navigate to the mobile frontend directory
Install Dependencies: Install the required npm packages.
Bash

npm install
# or
yarn install
Environment Variables: Create a .env file in the root of the mobile directory and configure the necessary environment variables, such as the API base URL and Google Maps API key.
API_BASE_URL=your_backend_api_url
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
FIREBASE_API_KEY=your_firebase_api_key
# ... other environment variables
Running the Application:
Android:
Bash

npx expo start --android
# or
yarn android
This will open Expo Go on your connected Android device or emulator.
iOS:
Bash

npx expo start --ios
# or
yarn ios
This will open Expo Go on your connected iOS device or simulator.
Development Workflow
Feature Branches: All new features should be developed in dedicated feature branches (feature/feature-name).
Bug Fixes: Bug fixes should be done in fix/bug-description branches.
Code Style: Follow the ESLint configuration (Airbnb style guide) and use Prettier for code formatting.
Committing Changes: Ensure your code is linted and formatted before committing. Husky pre-commit hooks are configured for this.
Pull Requests: Submit pull requests to merge your changes into the main branch. Code reviews are required for all PRs.
Testing
Unit Tests: Run unit tests using Jest:
Bash

npm test
# or
yarn test
Component Tests: Use React Native Testing Library for component-level testing.
End-to-End Tests: End-to-end tests are written using Detox. Refer to the testing documentation for setup and execution.
Deployment
Refer to the project's deployment documentation for detailed instructions on building and deploying the mobile application to the respective app stores (Google Play Store and Apple App Store).

