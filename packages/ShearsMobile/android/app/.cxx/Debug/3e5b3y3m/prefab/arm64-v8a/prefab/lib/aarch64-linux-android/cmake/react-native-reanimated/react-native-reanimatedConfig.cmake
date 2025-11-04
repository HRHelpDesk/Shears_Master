if(NOT TARGET react-native-reanimated::reanimated)
add_library(react-native-reanimated::reanimated SHARED IMPORTED)
set_target_properties(react-native-reanimated::reanimated PROPERTIES
    IMPORTED_LOCATION "/Users/masonmerrell/Documents/CurentProjects/Shears_Master/packages/ShearsMobile/node_modules/react-native-reanimated/android/build/intermediates/cxx/Debug/1d5p2q3d/obj/arm64-v8a/libreanimated.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/masonmerrell/Documents/CurentProjects/Shears_Master/packages/ShearsMobile/node_modules/react-native-reanimated/android/build/prefab-headers/reanimated"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

