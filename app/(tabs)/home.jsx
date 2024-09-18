import {
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons, images } from "../../constants";
import SearchInput from "../../components/SearchInput";
import { StatusBar } from "expo-status-bar";
import Trending from "../../components/Trending";
import EmptyState from "../../components/EmptyState";
import { useState } from "react";
import { deleteSavedVideo, getAllPosts, getLatestPosts } from "../../lib/appwrite";
import useAppwrite from "../../lib/useAppwrite";
import VideoCard from "../../components/VideoCard";
import { useGlobalContext } from "../../context/GlobalProvider";
import { saveVideo } from "../../lib/appwrite";

const Home = () => {
  
  const { user, setUser, setIsLoggedIn } = useGlobalContext();
  const { data: posts, refetch } = useAppwrite(getAllPosts); // for general
  const { data: latestPosts } = useAppwrite(getLatestPosts); //for trending

  const [refreshing, setrefreshing] = useState(false);

  const onRefresh = async () => {
    setrefreshing(true);
    await refetch();
    setrefreshing(false);
  };

  const handleSave = (videoId) => {
    saveVideo(user.$id, videoId)
      .then(() => {
        Alert.alert("Success", "Video saved successfully");
      })
      .catch((error) => {
        Alert.alert("Error", "Failed to save the video");
        console.error(error);
      });
  };

  const handleDelete = (videoId) => {
    deleteSavedVideo(user.$id, videoId)
      .then(() => {
      Alert.alert("Success", "Video deleted successfully")
      })
      .catch((error) => {
        Alert.alert("Error", "Failed to delete the video");
        console.log(error);
    })
  }
 
const menuItems = (videoId) => [
  {
    label: "Save",
    action: () => handleSave(videoId),
    icon: icons.bookmark,
  },
];

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        className="pb-10"
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VideoCard video={{ ...item, menuItems: menuItems(item.$id) }} />
        )}
        ListHeaderComponent={() => (
          <View className="my-6 px-4 space-y-6">
            <View className="justify-between items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-gray-100">
                  Welcome Back,
                </Text>
                <Text className="text-2xl font-psemibold text-white">
                  {user?.username}
                </Text>
              </View>
              <View className="mt-1.5">
                <Image
                  source={images.logoSmall}
                  className="w-9 h-10"
                  resizeMode="contain"
                />
              </View>
            </View>

            <SearchInput />

            <View className="w-full flex-1 pt-5 pb-8">
              <Text className="text-gray-100 text-lg font-pregular mb-3">
                Latest Videos
              </Text>

              <Trending posts={latestPosts ?? []} />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Videos Found"
            subtitle="Be the first one the upload a video."
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <StatusBar backgroundColor="#161622" style="light" />
    </SafeAreaView>
  );
};

export default Home;
