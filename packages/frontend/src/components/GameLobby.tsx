import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi'
import { keccak256, encodePacked } from 'viem'
import type { CourseObject } from '../types/shared'
import { MiniGolfABI } from '../abi/MiniGolf'
import { ENV } from '../config/env'
import { CourseGenerator } from '../generators/courseGenerator'
import { CoursePreview } from './CoursePreview'
import { LoadingSpinner } from './LoadingSpinner'

export function GameLobby() {
  const navigate = useNavigate()
  const { address } = useAccount()
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1)
  const [theme, setTheme] = useState<'classic' | 'desert' | 'ice' | 'space'>('classic')
  const [course, setCourse] = useState<CourseObject[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const { write: createGame, data: createTxData } = useContractWrite({
    address: ENV.GAME_CONTRACT_ADDRESS as `0x${string}`,
    abi: MiniGolfABI,
    functionName: 'createGame'
  })

  const { isLoading: isWaitingForTx, isSuccess } = useWaitForTransaction({
    hash: createTxData?.hash
  })

  const handleCreateGame = async () => {
    if (!address) return

    setIsCreating(true)
    try {
      const generator = new CourseGenerator()
      const newCourse = generator.generateCourse({
        difficulty,
        theme,
        seed: Math.floor(Math.random() * 1000000)
      })

      setCourse(newCourse)

      // Create course hash
      const courseHash = keccak256(
        encodePacked(
          ['uint8', 'string', 'uint256'],
          [difficulty, theme, BigInt(Date.now())]
        )
      )

      createGame({
        args: [[address], courseHash]
      })
    } catch (error) {
      console.error('Failed to create game:', error)
      setIsCreating(false)
    }
  }

  if (isSuccess && createTxData?.hash) {
    navigate(`/game/${createTxData.hash}`)
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Mini Golf</h1>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value) as 1 | 2 | 3)}
              className="w-full p-2 border rounded"
              disabled={isCreating}
            >
              <option value={1}>Easy</option>
              <option value={2}>Medium</option>
              <option value={3}>Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as typeof theme)}
              className="w-full p-2 border rounded"
              disabled={isCreating}
            >
              <option value="classic">Classic</option>
              <option value="desert">Desert</option>
              <option value="ice">Ice</option>
              <option value="space">Space</option>
            </select>
          </div>
        </div>

        {course.length > 0 && (
          <CoursePreview course={course} />
        )}

        <button
          onClick={handleCreateGame}
          disabled={isCreating || isWaitingForTx || !address}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isCreating || isWaitingForTx ? (
            <LoadingSpinner />
          ) : (
            'Create Game'
          )}
        </button>
      </div>
    </div>
  )
} 