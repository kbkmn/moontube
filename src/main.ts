const moons = document.querySelector<HTMLImageElement>("#moons")
const video = document.querySelector<HTMLVideoElement>("#video")
const canvas = document.querySelector<HTMLCanvasElement>("#canvas")
const context = canvas?.getContext("2d", { willReadFrequently: true })
const factor = 16
const compression = 0.9

const main = async () => {
  if (!moons || !video || !canvas) return

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { noiseSuppression: true },
    audio: false,
  })
  video.srcObject = stream

  video.addEventListener("loadedmetadata", (_: Event) => {
    setupCanvas()

    video.play()
    video.requestVideoFrameCallback(handleVideoFrame)
  })
}

const setupCanvas = () => {
  if (!video || !canvas) return

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
}

const handleVideoFrame = () => {
  if (!moons || !video || !context) return

  context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)

  const { data } = context.getImageData(
    0,
    0,
    video.videoWidth,
    video.videoHeight
  )

  context.clearRect(0, 0, video.videoWidth, video.videoHeight)

  const step = 255 / 5

  for (let y = 0; y < video.videoHeight; y += factor) {
    for (let x = 0; x < video.videoWidth; x += factor) {
      if ((y / factor) % 2 === 1 && x === video.videoWidth - factor) {
        continue
      }

      const xOffset = (y / factor) % 2 === 0 ? 0 : factor / 2

      const [r, g, b] = getPixelColor(
        x + xOffset,
        y,
        factor,
        video.videoWidth,
        data
      )
      const luminosity = getLuminocity(r, g, b)
      const frame = Math.min(Math.floor(luminosity / step), 4)

      context.drawImage(
        moons,
        frame * 200,
        0,
        200,
        200,
        (x + xOffset) * compression,
        y * compression,
        factor,
        factor
      )

      // context.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
      // context.fillStyle = `rgba(${luminosity}, ${luminosity}, ${luminosity}, 1)`
      // context.fillRect(x, y, factor, factor)
    }
  }

  video.requestVideoFrameCallback(handleVideoFrame)
}

const getPixelColor = (
  x: number,
  y: number,
  size: number,
  width: number,
  data: Uint8ClampedArray
) => {
  const offset = size / 2
  const square = size ** 2

  let [r, g, b] = [0, 0, 0]

  for (let _y = -offset; _y < offset; _y++) {
    for (let _x = -offset; _x < offset; _x++) {
      const idx = (x + y * width) * 4

      r += data[idx]
      g += data[idx + 1]
      b += data[idx + 2]
    }
  }

  return [r / square, g / square, b / square]
}

const getLuminocity = (r: number, g: number, b: number): number => {
  return 0.3 * r + 0.59 * g + 0.11 * b
}

main()
