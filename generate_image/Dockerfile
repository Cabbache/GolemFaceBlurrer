FROM ubuntu:23.10

ARG OPENCV_VERSION=4.7.0
ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /opt/build

RUN set -ex \
    && apt-get -qq update \
    && apt-get install -y --no-install-recommends \
        build-essential cmake \
        wget unzip \
        libhdf5-103-1 libhdf5-dev \
        libopenblas0 libopenblas-dev \
        libprotobuf32 libprotobuf-dev \
        libjpeg8 libjpeg8-dev \
        libpng16-16 libpng-dev \
        libtiff6 libtiff-dev \
        libwebp7 libwebp-dev \
        libopenjp2-7 libopenjp2-7-dev \
        libtbb12 libtbb-dev \
        libeigen3-dev \
				libavcodec-dev \
				libavformat-dev \
				libswscale-dev \
        tesseract-ocr tesseract-ocr-por libtesseract-dev \
        python3 python3-pip python3-numpy python3-dev

RUN wget -q --no-check-certificate https://github.com/opencv/opencv/archive/${OPENCV_VERSION}.zip -O opencv.zip \
    && unzip -qq opencv.zip -d /opt && rm -rf opencv.zip

RUN cmake \
        -D CMAKE_BUILD_TYPE=RELEASE \
        -D CMAKE_INSTALL_PREFIX=/usr/local \
        -D EIGEN_INCLUDE_PATH=/usr/include/eigen3 \
				-D WITH_FFMPEG=ON \
        -D OPENCV_ENABLE_NONFREE=OFF \
        /opt/opencv-${OPENCV_VERSION} \
    && make -j$(nproc) \
    && make install \
    && rm -rf /opt/build/* \
    && rm -rf /opt/opencv-${OPENCV_VERSION} \
    && apt-get -qq remove -y \
        software-properties-common \
        build-essential cmake \
        libhdf5-dev \
        libprotobuf-dev \
        libjpeg9-dev \
        libpng-dev \
        libtiff-dev \
        libwebp-dev \
        libopenjp2-7-dev \
        libtbb-dev \
        libtesseract-dev \
        python3-dev \
    && apt-get -qq autoremove \
    && apt-get -qq clean

RUN apt-get install build-essential python3-dev -y --no-install-recommends
RUN pip install --break-system-packages face_recognition

RUN mkdir -p /golem/tools
ADD blur.py /golem/tools

VOLUME /golem/work

WORKDIR /golem/work
