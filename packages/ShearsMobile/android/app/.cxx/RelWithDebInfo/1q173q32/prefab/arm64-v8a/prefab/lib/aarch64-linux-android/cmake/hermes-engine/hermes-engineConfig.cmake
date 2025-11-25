if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/masonmerrell/.gradle/caches/9.0.0/transforms/8389fd1377c75cdefbb2ecd4e3e47c7b/transformed/hermes-android-0.82.0-release/prefab/modules/hermesvm/libs/android.arm64-v8a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/masonmerrell/.gradle/caches/9.0.0/transforms/8389fd1377c75cdefbb2ecd4e3e47c7b/transformed/hermes-android-0.82.0-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

