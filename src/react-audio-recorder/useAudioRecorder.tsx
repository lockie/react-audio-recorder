import { useState, useRef } from 'react'
import { RECORD_STATUS } from './status'
import useTimer from './useTimer'

type record_status_type =
  | RECORD_STATUS.RECORDING
  | RECORD_STATUS.PAUSED
  | RECORD_STATUS.IDLE

let mediaRecorder: MediaRecorder
let localStream: MediaStream

export const useAudioRecorder = () => {
  const dataArray = useRef<Array<Blob>>([])

  const [status, setStatus] = useState<record_status_type>(RECORD_STATUS.IDLE)
  const [audioResult, setAudioResult] = useState<object>(null as any)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const {
    timer,
    handleStartTimer,
    handlePauseTimer,
    handleResumeTimer,
    handleResetTimer
  } = useTimer()

  const startRecording = () => {
    if (status === RECORD_STATUS.IDLE) {
      try {
        setErrorMessage('')
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((mediaStreamObj: MediaStream) => {
            localStream = mediaStreamObj
            mediaRecorder = new MediaRecorder(mediaStreamObj)
            mediaRecorder.start()
            mediaRecorder.onstart = () => {
              handleStartTimer()
              setStatus(RECORD_STATUS.RECORDING)
            }
            mediaRecorder.ondataavailable = (event: BlobEvent) => {
              dataArray.current.push(event.data)
            }
          })
          .catch((error) => {
            setErrorMessage(error?.message)
          })
      } catch (error) {
        setErrorMessage(error?.message)
      }
    } else {
      return
    }
  }

  const resumeRecording = () => {
    if (status === RECORD_STATUS.PAUSED) {
      mediaRecorder.resume()
      mediaRecorder.onresume = () => {
        handleResumeTimer()
        setStatus(RECORD_STATUS.RECORDING)
      }
    } else {
      return
    }
  }

  const pauseRecording = () => {
    if (status === RECORD_STATUS.RECORDING) {
      mediaRecorder.pause()
      mediaRecorder.onpause = () => {
        handlePauseTimer()
        setStatus(RECORD_STATUS.PAUSED)
      }
    } else {
      return
    }
  }

  const stopRecording = () => {
    if (status !== RECORD_STATUS.IDLE) {
      mediaRecorder.stop()
      mediaRecorder.onstop = () => {
        handleResetTimer()
        let audioData = new Blob(dataArray.current, { type: 'audio/webm;' })
        dataArray.current = []
        setAudioResult(audioData)
        setStatus(RECORD_STATUS.IDLE)
        localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
          track.stop()
        })
      }
    } else {
      return
    }
  }

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    status,
    audioResult,
    errorMessage,
    timer
  }
}
