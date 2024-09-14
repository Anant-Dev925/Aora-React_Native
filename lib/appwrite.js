import { Avatars, Client, Databases } from "react-native-appwrite";
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

//Registering User
export async function createUser (email, password, username) {
    try {
      const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        username
      )

      if (!newAccount) throw Error;

      const avatarUrl = avatars.getInitials(username)

      await signIn(email, password);

      const newUser = await databases.createDocument(
        config.databaseId,
        config.userCollectionId,
        ID.unique(),
        {
          accountID: newAccount.$id,
          email: email,
          username: username,
          avatar: avatarUrl,
        }
      );
      
      return newUser;
    } catch (error) {
      console.log(error);
      throw new Error(error);
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

    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

     if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error)
    return null;
  }
}

//Get all Video Posts
export async function getAllPosts() {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId
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
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}