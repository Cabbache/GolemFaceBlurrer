import './App.css'
import Dots from 'react-activity/dist/Dots'
import Markdown from 'react-markdown';
import 'react-activity/dist/Dots.css'
import React, { useEffect, useState } from 'react'
import * as golem from '@golem-sdk/golem-js'

const docs_md = `
# Golem face blurrer

## Why?

According to ChatGPT:

* • Privacy Protection in Public Recordings: For videos captured in public spaces where individuals have not consented to be filmed, blurring faces can protect their privacy when such videos are shared publicly or used in news broadcasts.

* • Anonymity in Sensitive Content: In interviews or documentaries featuring sensitive topics, subjects may wish to remain anonymous. Blurring faces can help protect their identities.

* • Security Footage Redaction: For security or surveillance footage that needs to be shared with law enforcement or the public, blurring faces can protect the privacy of innocent bystanders or victims.

* • Data Protection Compliance: In regions with strict data protection laws (like GDPR in Europe), blurring faces in videos can help organizations comply with regulations concerning personal data and privacy.

* • Educational Content: When educational videos include students or minors, blurring faces can protect minors' identities, especially when such content is shared online.

* • Research and Development: Researchers studying public behavior or crowd dynamics might use videos with blurred faces to ensure participants' anonymity.

* • Journalism and Reporting: Reporters might blur faces in videos to protect sources or individuals in sensitive or dangerous situations.

* • Social Media Content Moderation: Platforms may use face-blurring tools to automatically redact faces in videos uploaded by users, particularly in contexts where consent to film and share is unclear.

* • Protecting Witnesses or Whistleblowers: Videos featuring witnesses or whistleblowers can have faces blurred to maintain their safety and confidentiality.

* • Blurring Faces in User-Generated Content: For apps and services that allow users to upload video content, providing an option to blur faces can help users maintain privacy and control over their digital footprint.

* • Video Redaction for Legal Proceedings: In legal cases where video evidence is presented, faces may need to be blurred to protect the identities of certain individuals.

* • Content Filtering for Children: Blurring faces in videos that might not be appropriate for children can be an additional layer of protection in content filtering systems.

* • Ethical AI Training: For AI and machine learning projects that use video data, blurring faces can address ethical concerns related to privacy and consent in training datasets.

* • Corporate Training Videos: In internal training videos where employees are featured, blurring faces can maintain privacy, especially if such content is at risk of being shared beyond the intended audience.

## The script running on the provider

This is stored in blur.py on the image:

~~~python
import sys
import face_recognition
import cv2

if len(sys.argv) != 3:
	print("Usage: blur.py <input file (mp4)> <destination file (mp4)>")
	sys.exit(1)

video_capture = cv2.VideoCapture(sys.argv[1])

width  = int(video_capture.get(3))
height = int(video_capture.get(4))

writer = cv2.VideoWriter(sys.argv[2], cv2.VideoWriter_fourcc(*"avc1"), 30,(width, height))

face_locations = []

while True:
  ret, frame = video_capture.read()

  if ret == False:
  	break

  face_locations = face_recognition.face_locations(frame)

  for top, right, bottom, left in face_locations:
    face_image = frame[top:bottom, left:right]

    face_image = cv2.GaussianBlur(face_image, (99, 99), 30)

    frame[top:bottom, left:right] = face_image

  writer.write(frame)

video_capture.release()
writer.release()
~~~

## The execution task

~~~javascript
const result = await executor.run(async (ctx) => {
	await ctx.uploadData(videoData, '/golem/work/video.mp4')
	const process_file = await ctx.run(
		'python3 /golem/tools/blur.py /golem/work/video.mp4 /golem/work/result.mp4'
	)
	appendLog(JSON.stringify(process_file))
	return await ctx.downloadData('/golem/work/result.mp4')
})
~~~

## Image

The Dockerfile used for the image builds opencv and installs [face_recognition](https://github.com/ageitgey/face_recognition) library

~~~
FROM ubuntu:23.10

ARG OPENCV_VERSION=4.7.0
ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /opt/build

RUN set -ex \\
    && apt-get -qq update \\
    && apt-get install -y --no-install-recommends \\
        build-essential cmake \\
        wget unzip \\
        libhdf5-103-1 libhdf5-dev \\
        libopenblas0 libopenblas-dev \\
        libprotobuf32 libprotobuf-dev \\
        libjpeg8 libjpeg8-dev \\
        libpng16-16 libpng-dev \\
        libtiff6 libtiff-dev \\
        libwebp7 libwebp-dev \\
        libopenjp2-7 libopenjp2-7-dev \\
        libtbb12 libtbb-dev \\
        libeigen3-dev \\
        libavcodec-dev \\
        libavformat-dev \\
        libswscale-dev \\
        tesseract-ocr tesseract-ocr-por libtesseract-dev \\
        python3 python3-pip python3-numpy python3-dev

RUN wget -q --no-check-certificate https://github.com/opencv/opencv/archive/\${OPENCV_VERSION}.zip -O opencv.zip \\
    && unzip -qq opencv.zip -d /opt && rm -rf opencv.zip

RUN cmake \\
        -D CMAKE_BUILD_TYPE=RELEASE \\
        -D CMAKE_INSTALL_PREFIX=/usr/local \\
        -D EIGEN_INCLUDE_PATH=/usr/include/eigen3 \\
				-D WITH_FFMPEG=ON \\
        -D OPENCV_ENABLE_NONFREE=OFF \\
        /opt/opencv-\${OPENCV_VERSION} \\
    && make -j$(nproc) \\
    && make install \\
    && rm -rf /opt/build/* \\
    && rm -rf /opt/opencv-\${OPENCV_VERSION} \\
    && apt-get -qq remove -y \\
        software-properties-common \\
        build-essential cmake \\
        libhdf5-dev \\
        libprotobuf-dev \\
        libjpeg9-dev \\
        libpng-dev \\
        libtiff-dev \\
        libwebp-dev \\
        libopenjp2-7-dev \\
        libtbb-dev \\
        libtesseract-dev \\
        python3-dev \\
    && apt-get -qq autoremove \\
    && apt-get -qq clean

RUN apt-get install build-essential python3-dev -y --no-install-recommends
RUN pip install --break-system-packages face_recognition

RUN mkdir -p /golem/tools
ADD blur.py /golem/tools

VOLUME /golem/work

WORKDIR /golem/work
~~~

## Known issues
* • Sometimes it just doesn't work, and restarting yagna fixes it
* • This tool only uses the testnet, and uploading videos larger than the ones included in this repository may not work out of the box that way

## History

It originally did not use OpenCV, but instead just used ffmpeg to blur the images, this resulted in a pyton script that takes the output from the cli face_detection and generates a bash script with a lot of ffmpeg commands to blur all images. However, this did not work for unexpected reasons, it seemed like the task did not finish executing most of the time.

There was also another variation of the ffmpeg version that attempts to parallelise the blurring, but this required uploading the video to every provider, and that combined with the complexity to debug it outweighed the benefits.

### Credit
This was made by [Cabbache](https://github.com/Cabbache) during the DEGEN.HOUSE [DegenHack 2024](https://www.degenhack.dev/)
`;

function App() {
  const [yagnaApiBasePath, setYagnaApiBasePath] = useState(
    'http://127.0.0.1:7465'
  )
  const [subnetTag, setSubnetTag] = useState('public')
  const [videoData, setVideoData] = useState(null)
  const [videoBlob, setVideoBlob] = useState(null)
  const [blurredVideoBlob, setBlurredVideoBlob] = useState(null)
  const [running, setRunning] = useState(false)
  const [packageHash, setPackageHash] = useState(process.env.REACT_APP_IMAGE || "");
  const [logs, setLogs] = useState([])

	const [showHelp, setShowHelp] = useState(false)

	useEffect(() => {
		document.title = 'Golem face blurrer';
	}, []);

	const toggleHelp = () => {
    setShowHelp(!showHelp);
  };

  const readFile = (file) => {
    console.log()
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.readAsArrayBuffer(file)

      fileReader.onload = () => {
        resolve(new Uint8Array(fileReader.result))
      }

      fileReader.onerror = (error) => {
        reject(error)
      }
    })
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (file) {
      try {
        const videoData = await readFile(file)
        setVideoData(videoData)
        setVideoBlob(URL.createObjectURL(file))
      } catch (error) {
        logger.error('Failed to load video:', error)
      }
    }
  }

  const appendLog = (msg, level = 'info') => {
    const logEntry = `[${new Date().toISOString()}] [${level}] ${msg}`
    setLogs((prevLogs) => [...prevLogs, logEntry])
  }

  const logger = {
    error: (msg) => appendLog(msg, 'error'),
    info: (msg) => appendLog(msg, 'info'),
    warn: (msg) => appendLog(msg, 'warn'),
    debug: (msg) => appendLog(msg, 'debug'),
    child: () => logger,
  }

  const run = async () => {
    let executor = null
    try {
      setRunning(true)

      executor = await golem.TaskExecutor.create({
        package: packageHash,
        yagnaOptions: { apiKey: 'try_golem', basePath: yagnaApiBasePath },
        subnetTag: subnetTag,
        logger,
      })

      const result = await executor.run(async (ctx) => {
        await ctx.uploadData(videoData, '/golem/work/video.mp4')
        const process_file = await ctx.run(
          'python3 /golem/tools/blur.py /golem/work/video.mp4 /golem/work/result.mp4'
        )
        appendLog(JSON.stringify(process_file))
        return await ctx.downloadData('/golem/work/result.mp4')
      })

      let urlObject = URL.createObjectURL(
        new Blob([result.data], { type: 'video/mp4' })
      )
      setBlurredVideoBlob(urlObject)
    } catch (error) {
      setBlurredVideoBlob(null)
      logger.error('Computation failed:', error)
    } finally {
      setRunning(false)
      if (executor) await executor.shutdown()
    }
  }

  return (
    <div className='App'>
      <header className='App-header'>
        <img src='./golem.png' alt="golem_logo" />
        <h1>face blurrer 🫠</h1>
				<button onClick={toggleHelp} className="help-button">?</button> {/* Style this button as needed */}
      </header>
			{showHelp ? (
        <div className='App-content2'>
          <Markdown>{docs_md}</Markdown>
        </div>
      ) : (
        <div className='App-content'>
					<div className='Options'>
						<h2>Options</h2>
						<div className='Option-item'>
							<label htmlFor='YAGNA_API_BASEPATH'>Yagna API BaseUrl:</label>
							<input
								id='YAGNA_API_BASEPATH'
								type='text'
								value={yagnaApiBasePath}
								onChange={(e) => setYagnaApiBasePath(e.target.value)}
							/>
						</div>
						<div className='Option-item'>
							<label htmlFor='SUBNET_TAG'>Subnet Tag:</label>
							<input
								id='SUBNET_TAG'
								type='text'
								value={subnetTag}
								onChange={(e) => setSubnetTag(e.target.value)}
							/>
						</div>
						<div className='Option-item'>
							<label htmlFor='IMAGE_HASH'>Package hash:</label>
							<input
								id='IMAGE_HASH'
								type='text'
								value={packageHash}
								onChange={(e) => setPackageHash(e.target.value)}
							/>
						</div>
						<div className='Option-item'>
							<label htmlFor='videoInput'>Select Video:</label>
							<input
								id='videoInput'
								type='file'
								accept='video/*'
								onChange={handleFileSelect}
							/>
						</div>
						<button
							onClick={run}
							disabled={!videoData || running}
							style={{
								backgroundColor: !!videoData && !running ? 'green' : 'grey',
							}}
						>
							Blur faces
						</button>
					</div>
					<div className='Actions'>
						<h2>Original video</h2>
						{videoBlob && (
							<video key={videoBlob} width='320' height='240' controls>
								<source src={videoBlob} type='video/mp4' />
								Your browser does not support the video tag.
							</video>
						)}
					</div>
					<div className='Results'>
						<h2>Faces blurred</h2>
						{running && <Dots />}
						{!running && blurredVideoBlob && (
							<video key={blurredVideoBlob} width='320' height='240' controls>
								<source src={blurredVideoBlob} type='video/mp4' />
								Your browser does not support the video tag.
							</video>
						)}
					</div>
					<div className='Logs'>
						<h2>Logs</h2>
						<ul>
							{logs.map((log, index) => (
								<li key={index}>{log}</li>
							))}
						</ul>
					</div>
        </div>
      )}
    </div>
  )
}

export default App
