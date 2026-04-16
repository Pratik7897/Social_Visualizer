cmake_minimum_required(VERSION 3.10)
project(SocialConnectDS)

set(CMAKE_CXX_STANDARD 17)

include_directories(include)

add_executable(SocialConnectDemo 
    main.cpp 
    src/AVLTree.cpp 
    src/BTree.cpp 
    src/SocialGraph.cpp
)
