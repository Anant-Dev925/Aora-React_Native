import { Avatars, Client, Databases, Storage } from "react-native-appwrite";
import { Account, ID, Query } from "react-native-appwrite";

export const config = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.native.aora",
  projectId: "66e19a330034b5cbb4d2",
  databaseId: "66e19b430008ee42dea8",
  userCollectionId: "66e19b66000edb8fbf79",
  videoCollectionId: "66e19b8a001096b15ded",
  storageId: "66e19d0400139491ffe5",
}

// Init your React Native SDK
const client = new Client();

client
  .setEndpoint(config.endpoint) // Your Appwrite Endpoint
  .setProject(config.projectId) // Your project ID
  .setPlatform(config.platform); // Your application ID or bundle ID.
  
const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

//Registering User
export async function createUser(email, password, username) {
  try {
    // Step 1: Create the account in Appwrite's auth system
    const newAccount = await account.create(
      ID.unique(), // Generate a unique ID for the account
      email,
      password,
      username
    );

    if (!newAccount) throw new Error("Account creation failed");

    // Step 2: Get the avatar URL
    const avatarUrl = avatars.getInitials(username);

    // Step 3: Sign in the user (optional, depending on your flow)
    await signIn(email, password);

    // Step 4: Create the user in the custom database
    const newUser = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      ID.unique(), // Generate a unique ID for the user document
      {
        accountId: newAccount.$id, // Correct the field name here
        email: email,
        username: username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error) {
    console.error("Error in createUser:", error);
    throw new Error(error.message || "User creation failed");
  }
}

//Sign In
export async function signIn(email, password) {
  try {
    const session = await account.createEmailPasswordSession
      (email, password)
    
    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();
    // console.log(currentAccount)
    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    // Step 1: Get the current account information
    const currentAccount = await getAccount();
    if (!currentAccount) throw new Error("No account found");

    // Step 2: Query the database using the accountId
    const currentUser = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    // Step 3: Check if the query returned any results
    if (!currentUser || currentUser.documents.length === 0) {
      throw new Error("No user found in the database with this accountId");
    }

    // Step 4: Log the full current user data
    // console.log("Current User:", currentUser);

    return currentUser.documents[0]; // Return the first user document found
  } catch (error) {
    // Step 5: Log any error encountered
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

//Get all Video Posts
export async function getAllPosts() {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.orderDesc("$createdAt")]
    );
    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get latest created video posts
export async function getLatestPosts() {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents;
  } catch (error) {
    console.log(error)
    throw new Error(error);
  }
}

//Search Posts
export async function searchPosts(query) {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.search('title', query)]
    );

    return posts.documents;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

//Get video posted by single user
export async function getUserPosts(userId) {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.equal("creator", userId)]
    );

    return posts.documents;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

//Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Get File Preview
export async function getFilePreview(fileId, type) {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(config.storageId, fileId);
    } else if (type === "image") {
        fileUrl = storage.getFilePreview(
        config.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

//Upload File
export async function uploadFile(file, type) {
  if (!file) return;

  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri,
   };

  try {
    const uploadedFile = await storage.createFile(
      config.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideo(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

     const newPost = await databases.createDocument(
       config.databaseId,
       config.videoCollectionId,
       ID.unique(),
       {
         title: form.title,
         thumbnail: thumbnailUrl,
         video: videoUrl,
         prompt: form.prompt,
         creator: form.userId,
       }
     )
       return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

