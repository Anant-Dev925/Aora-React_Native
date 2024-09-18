import {
  Avatars,
  Client,
  Databases,
  Storage,
  Account,
  ID,
  Query,
} from "react-native-appwrite";


export const config = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.astra.dev",
  projectId: "66e19a330034b5cbb4d2",
  databaseId: "66e19b430008ee42dea8",
  userCollectionId: "66e19b66000edb8fbf79",
  videoCollectionId: "66e19b8a001096b15ded",
  savesCollectionId: "66e8ff5e002b3b141b4f",
  storageId: "66e19d0400139491ffe5",
};

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
    const session = await account.createEmailPasswordSession(email, password);

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
    const currentAccount = await getAccount();
    if (!currentAccount) throw new Error("No account found");

    const currentUser = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser || currentUser.documents.length === 0) {
      throw new Error("No user found in the database with this accountId");
    }

    return currentUser.documents[0]; 
  } catch (error) {
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
    console.log(error);
    throw new Error(error);
  }
}

//Search Posts
export async function searchPosts(query) {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.search("title", query)]
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
    );
    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

//Saving Video
export async function saveVideo(userId, videoId) {
  try {
    // Check if both parameters are provided
    if (!userId || !videoId) {
      throw new Error("Missing userId or videoId");
    }

    // Check if the video is already saved by the user
    const existingSave = await databases.listDocuments(
      config.databaseId, 
      config.savesCollectionId, 
      [Query.equal("user_id", userId), Query.equal("video_id", videoId)]
    );

    if (existingSave.total > 0) {
      // If a document already exists, do not insert again
      console.log("Video already saved");
      return { success: false, message: "Video already saved" };
    }

    // Insert the document into the "save" database
    const result = await databases.createDocument(
      config.databaseId,
      config.savesCollectionId, 
      ID.unique(), 
      {
        user_id: userId,
        video_id: videoId,
      }
    );

    return { success: true, result }; 
  } catch (error) {
    console.log("Error saving video:", error);
    throw new Error(error); 
  }
}

// Get Saved Videos
export async function getSavedPosts(userId) {
  try {
    // Fetch saved video records for the given userId
    const savedVideos = await databases.listDocuments(
      config.databaseId,
      config.savesCollectionId,
      [Query.equal("user_id", userId)]
    );

    if (savedVideos.total === 0) {
      return [];
    }

    // Extract video IDs from saved records
    const videoIds = savedVideos.documents.map((doc) => doc.video_id);

    // Fetch video details using the extracted video IDs
    const videoDetailsPromises = videoIds.map((videoId) =>
      databases.getDocument(
        config.databaseId,
        config.videoCollectionId,
        videoId
      )
    );

    const videoDetails = await Promise.all(videoDetailsPromises);

    return videoDetails;
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    throw new Error(error.message || "Failed to fetch saved posts");
  }
}

//Deleting Saved Videos
export async function deleteSavedVideo(userId, videoId) {
  try {
    if (!userId || !videoId) {
      throw new Error("Missing userId or videoId");
    }

    const savedVideos = await databases.listDocuments(
      config.databaseId, 
      config.savesCollectionId,
      [
        Query.equal("user_id", userId), 
        Query.equal("video_id", videoId),
      ]
    );

   
    if (savedVideos.total === 0) {
      throw new Error("No saved video found for this user and video.");
    }


    const documentId = savedVideos.documents[0].$id;


    const result = await databases.deleteDocument(
      config.databaseId, 
      config.savesCollectionId,
      documentId 
    );

    console.log(`Deleted saved video with document ID: ${documentId}`);
    return result;
  } catch (error) {
    console.error("Error deleting saved video:", error);
    throw new Error(error.message || "Failed to delete saved video");
  }
}

//Deleting Video Post
export async function deleteVideoPost(videoId) {
  try {
   
    const result = await databases.deleteDocument(
      config.databaseId,
      config.videoCollectionId,
      videoId 
    );

    console.log("Video post deleted successfully:", result);
    return result; 
  } catch (error) {
    console.error("Error deleting video post:", error);
    throw new Error(error); 
  }
}

