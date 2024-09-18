import { View, Text, Image, TouchableOpacity, Alert } from 'react-native'
import React, {useState} from 'react'
import { icons } from '../constants'
import { ResizeMode, Video } from 'expo-av'

const Menu = ({ menuItems}) => {
  
  return (
    <View className="absolute top-12 right-5 bg-black-100 rounded-lg p-2 z-50 w-36 max-h-72 overflow-hidden">
      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          className="p-2 flex-row"
          onPress={item.action}
        >
          <Image source={item.icon} resizeMode='contain' className="h-[20px] w-[20px] mr-2 " />
          <Text className="text-white font-pmedium">{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};


const VideoCard = ({ video: { $id, title, thumbnail, video, creator: { username, avatar }, menuItems } }) => {
  const [play, setplay] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View className="flex-col items-center px-4 mb-14">
      <View className="flex-row gap-3 items-center">
        <View className="justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary justify-center items-center p-0.5">
            <Image
              source={{ uri: avatar }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          </View>
          <View className="justify-center flex-1 ml-3 gap-y-1">
            <Text
              className="text-white font-psemibold text-sm"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text className="text-xs text-gray-100 font-pregular">
              {username}
            </Text>
          </View>
        </View>
        <View className="pt-2 relative">
          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
            <Image
              source={icons.menu}
              className="w-5 h-5"
              resizeMode="contain"
            />
          </TouchableOpacity>
          {menuVisible && <Menu menuItems={menuItems}/>}
        </View>
      </View>
      {play ? (
        (console.log(video),
        (
          <Video
            source={{ uri: video }}
            className="w-full h-60 rounded-xl mt-3"
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                setplay(false);
              }
            }}
            onError={(error) => console.log("Video playback error:", error)}
          />
        ))
      ) : (
        <TouchableOpacity
          className="w-full h-60 rounded-xl mt-3 relative justify-center items-center"
          activeOpacity={0.7}
          onPress={() => setplay(true)}
        >
          <Image
            source={{ uri: thumbnail }}
            className="w-full h-full rounded-xl mt-3"
            resizeMode="cover"
          />
          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default VideoCard