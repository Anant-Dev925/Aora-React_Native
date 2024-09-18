import { View, Text, SafeAreaView, ScrollView, RefreshControl, FlatList, Alert } from 'react-native'
import React, {useState} from 'react'
import EmptyState from "../../components/EmptyState";
import useAppwrite from "../../lib/useAppwrite";
import { deleteSavedVideo, getSavedPosts } from '../../lib/appwrite';
import VideoCard from '../../components/VideoCard';
import { icons } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';

const saved = () => {
  const { user } = useGlobalContext();
  const { data: posts, refetch } = useAppwrite(() => getSavedPosts(user.$id));
  const [refreshing, setrefreshing] = useState(false);

  const onRefresh = async () => {
    setrefreshing(true);
    await refetch();
    setrefreshing(false);
  };

 const handleUnSave = async (videoId) => {
   try {
     await deleteSavedVideo(user.$id, videoId);
     Alert.alert("Success", "Video removed from save");
     await refetch(); 
   } catch (error) {
     Alert.alert("Error", "Failed to unsave the video");
     console.error(error);
   }
 };

  const menuItems = (videoId) => [
    {
      label: "Unsave",
      action: () => handleUnSave(videoId), 
      icon: icons.bookmark,
    },
    // {
    //   label: "Delete",
    //   action: () => handleDelete(videoId), // Pass the correct videoId here
    //   icon: icons.delete,
    // },
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
          <ScrollView className="px-4 my-6 pt-10">
            <Text className="text-white text-2xl pb-6 font-psemibold">
              Saved Videos
            </Text>
          </ScrollView>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Videos Found"
            subtitle="Save your favourite videos to see here"
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

export default saved