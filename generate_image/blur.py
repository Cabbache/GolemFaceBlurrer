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
